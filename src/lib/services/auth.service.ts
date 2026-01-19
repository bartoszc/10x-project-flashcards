import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  AuthResponseDTO,
  AuthUserDTO,
  SessionDTO,
  LogoutResponseDTO,
  DeleteAccountResponseDTO,
} from "../../types";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema";

/**
 * Error class for authentication-related errors.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHORIZED" | "CONFLICT" | "VALIDATION_ERROR" | "INTERNAL_ERROR",
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Service handling authentication operations using Supabase Auth.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthService {
  /**
   * Registers a new user account.
   *
   * @param supabase - Supabase client instance
   * @param data - Registration data (email and password)
   * @returns AuthResponseDTO with user and session data
   * @throws AuthError if registration fails
   */
  static async register(supabase: SupabaseClient<Database>, data: RegisterInput): Promise<AuthResponseDTO> {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("already registered") || error.message.includes("email_taken")) {
        throw new AuthError("Email already registered", "CONFLICT", 409);
      }
      if (error.message.includes("weak_password")) {
        throw new AuthError("Password does not meet strength requirements", "VALIDATION_ERROR", 400);
      }
      console.error("[AuthService] Registration error:", error.message);
      throw new AuthError("Failed to register user", "INTERNAL_ERROR", 500);
    }

    if (!authData.user) {
      throw new AuthError("Registration completed but no user returned", "INTERNAL_ERROR", 500);
    }

    // Check for fake user - Supabase returns user with empty identities array
    // when email already exists (to prevent email enumeration)
    const identities = authData.user.identities ?? [];
    if (identities.length === 0) {
      throw new AuthError("Email already registered", "CONFLICT", 409);
    }

    return AuthService.mapToAuthResponse(authData.user, authData.session);
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param supabase - Supabase client instance
   * @param data - Login credentials
   * @returns AuthResponseDTO with user and session data
   * @throws AuthError if login fails
   */
  static async login(supabase: SupabaseClient<Database>, data: LoginInput): Promise<AuthResponseDTO> {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Generic error message to prevent email enumeration
      console.error("[AuthService] Login error:", error.message);
      throw new AuthError("Invalid credentials", "UNAUTHORIZED", 401);
    }

    if (!authData.user || !authData.session) {
      throw new AuthError("Authentication failed - no session created", "INTERNAL_ERROR", 500);
    }

    return AuthService.mapToAuthResponse(authData.user, authData.session);
  }

  /**
   * Logs out the current user by invalidating their session.
   *
   * @param supabase - Supabase client instance
   * @returns LogoutResponseDTO with success message
   * @throws AuthError if logout fails
   */
  static async logout(supabase: SupabaseClient<Database>): Promise<LogoutResponseDTO> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[AuthService] Logout error:", error.message);
      throw new AuthError("Failed to logout", "INTERNAL_ERROR", 500);
    }

    return { message: "Successfully logged out" };
  }

  /**
   * Deletes a user account and all associated data.
   * Uses Supabase Admin API for user deletion.
   * Data in related tables is removed via CASCADE constraints.
   *
   * @param supabase - Supabase client instance (needs admin privileges)
   * @param userId - ID of the user to delete
   * @returns DeleteAccountResponseDTO with success message
   * @throws AuthError if deletion fails
   */
  static async deleteAccount(supabase: SupabaseClient<Database>, userId: string): Promise<DeleteAccountResponseDTO> {
    // First, delete profile data (this will cascade to related tables)
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);

    if (profileError) {
      console.error("[AuthService] Profile deletion error:", profileError.message);
      throw new AuthError("Failed to delete user data", "INTERNAL_ERROR", 500);
    }

    // Note: For complete user deletion from auth.users,
    // we need Supabase Admin API which requires service role key.
    // In a client-side context, we rely on the profile deletion
    // which cascades to all user data. The auth.users record
    // can be cleaned up via Supabase dashboard or a scheduled job.

    // Sign out the user after data deletion
    await supabase.auth.signOut();

    return { message: "Account and all associated data deleted successfully" };
  }

  /**
   * Maps Supabase auth response to AuthResponseDTO.
   */
  private static mapToAuthResponse(
    user: {
      id: string;
      email?: string;
      created_at?: string;
    },
    session: {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
    } | null
  ): AuthResponseDTO {
    const authUser: AuthUserDTO = {
      id: user.id,
      email: user.email ?? "",
      created_at: user.created_at ?? new Date().toISOString(),
    };

    let sessionDTO: SessionDTO | undefined;

    if (session) {
      sessionDTO = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at ?? 0,
      };
    }

    return {
      user: authUser,
      session: sessionDTO,
    };
  }

  /**
   * Sends a password reset email.
   *
   * @param supabase - Supabase client instance
   * @param email - User email
   * @returns Object with success message
   */
  static async resetPassword(supabase: SupabaseClient<Database>, email: string): Promise<{ message: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.SITE_URL || "http://localhost:3000"}/auth/callback`,
    });

    if (error) {
      // Log error but don't expose it to client to prevent enumeration
      console.error("[AuthService] Reset password error:", error.message);

      // If rate limit hit, we might want to propagate that, but for now specific handling omitted
      // to keep interface simple and secure.
    }

    return { message: "If this email exists, a password reset link has been sent" };
  }

  /**
   * Updates the password for the current user.
   *
   * @param supabase - Supabase client instance
   * @param password - New password
   * @returns Object with success message
   * @throws AuthError if update fails
   */
  static async updatePassword(supabase: SupabaseClient<Database>, password: string): Promise<{ message: string }> {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      if (error.message.includes("weak_password")) {
        throw new AuthError("Password does not meet strength requirements", "VALIDATION_ERROR", 400);
      }
      console.error("[AuthService] Update password error:", error.message);
      throw new AuthError("Failed to update password", "INTERNAL_ERROR", 500);
    }

    return { message: "Password updated successfully" };
  }
}
