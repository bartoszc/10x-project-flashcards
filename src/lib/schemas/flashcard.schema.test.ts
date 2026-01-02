import { describe, expect, it } from "vitest";

import { getFlashcardsQuerySchema } from "@/lib/schemas/flashcard.schema";

/**
 * Unit tests for flashcard query schema.
 *
 * Business rules:
 * - page: positive integer, default 1
 * - limit: 1-100, default 20
 * - source: optional, "ai" or "manual"
 * - sort: optional, "created_at" | "updated_at" | "next_review_date", default "created_at"
 * - order: optional, "asc" | "desc", default "desc"
 */
describe("Flashcard Schema", () => {
  describe("getFlashcardsQuerySchema", () => {
    describe("defaults", () => {
      it("should apply default values when no params provided", () => {
        const result = getFlashcardsQuerySchema.safeParse({});

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
          expect(result.data.sort).toBe("created_at");
          expect(result.data.order).toBe("desc");
          expect(result.data.source).toBeUndefined();
        }
      });
    });

    describe("page parameter", () => {
      it("should accept valid positive integer page", () => {
        const result = getFlashcardsQuerySchema.safeParse({ page: 5 });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(5);
        }
      });

      it("should coerce string page to number", () => {
        const result = getFlashcardsQuerySchema.safeParse({ page: "3" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(3);
        }
      });

      it("should reject page 0", () => {
        const result = getFlashcardsQuerySchema.safeParse({ page: 0 });
        expect(result.success).toBe(false);
      });

      it("should reject negative page", () => {
        const result = getFlashcardsQuerySchema.safeParse({ page: -1 });
        expect(result.success).toBe(false);
      });

      it("should reject non-integer page", () => {
        const result = getFlashcardsQuerySchema.safeParse({ page: 1.5 });
        expect(result.success).toBe(false);
      });
    });

    describe("limit parameter", () => {
      it("should accept limit of 1 (minimum boundary)", () => {
        const result = getFlashcardsQuerySchema.safeParse({ limit: 1 });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(1);
        }
      });

      it("should accept limit of 100 (maximum boundary)", () => {
        const result = getFlashcardsQuerySchema.safeParse({ limit: 100 });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(100);
        }
      });

      it("should coerce string limit to number", () => {
        const result = getFlashcardsQuerySchema.safeParse({ limit: "50" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
        }
      });

      it("should reject limit of 0 (below minimum)", () => {
        const result = getFlashcardsQuerySchema.safeParse({ limit: 0 });
        expect(result.success).toBe(false);
      });

      it("should reject limit of 101 (above maximum)", () => {
        const result = getFlashcardsQuerySchema.safeParse({ limit: 101 });
        expect(result.success).toBe(false);
      });

      it("should reject limit of 500 (well above maximum)", () => {
        const result = getFlashcardsQuerySchema.safeParse({ limit: 500 });
        expect(result.success).toBe(false);
      });
    });

    describe("source parameter", () => {
      it("should accept source 'ai'", () => {
        const result = getFlashcardsQuerySchema.safeParse({ source: "ai" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.source).toBe("ai");
        }
      });

      it("should accept source 'manual'", () => {
        const result = getFlashcardsQuerySchema.safeParse({ source: "manual" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.source).toBe("manual");
        }
      });

      it("should reject invalid source value", () => {
        const result = getFlashcardsQuerySchema.safeParse({ source: "unknown" });
        expect(result.success).toBe(false);
      });

      it("should reject source 'AI' (case sensitive)", () => {
        const result = getFlashcardsQuerySchema.safeParse({ source: "AI" });
        expect(result.success).toBe(false);
      });
    });

    describe("sort parameter", () => {
      it("should accept sort 'created_at'", () => {
        const result = getFlashcardsQuerySchema.safeParse({ sort: "created_at" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe("created_at");
        }
      });

      it("should accept sort 'updated_at'", () => {
        const result = getFlashcardsQuerySchema.safeParse({ sort: "updated_at" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe("updated_at");
        }
      });

      it("should accept sort 'next_review_date'", () => {
        const result = getFlashcardsQuerySchema.safeParse({ sort: "next_review_date" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe("next_review_date");
        }
      });

      it("should reject invalid sort field", () => {
        const result = getFlashcardsQuerySchema.safeParse({ sort: "front" });
        expect(result.success).toBe(false);
      });
    });

    describe("order parameter", () => {
      it("should accept order 'asc'", () => {
        const result = getFlashcardsQuerySchema.safeParse({ order: "asc" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.order).toBe("asc");
        }
      });

      it("should accept order 'desc'", () => {
        const result = getFlashcardsQuerySchema.safeParse({ order: "desc" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.order).toBe("desc");
        }
      });

      it("should reject invalid order value", () => {
        const result = getFlashcardsQuerySchema.safeParse({ order: "ascending" });
        expect(result.success).toBe(false);
      });
    });

    describe("combined parameters", () => {
      it("should accept all valid parameters together", () => {
        const result = getFlashcardsQuerySchema.safeParse({
          page: 2,
          limit: 50,
          source: "ai",
          sort: "updated_at",
          order: "asc",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            page: 2,
            limit: 50,
            source: "ai",
            sort: "updated_at",
            order: "asc",
          });
        }
      });

      it("should apply defaults for missing optional parameters", () => {
        const result = getFlashcardsQuerySchema.safeParse({
          page: 3,
          source: "manual",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(3);
          expect(result.data.limit).toBe(20); // default
          expect(result.data.source).toBe("manual");
          expect(result.data.sort).toBe("created_at"); // default
          expect(result.data.order).toBe("desc"); // default
        }
      });
    });
  });
});
