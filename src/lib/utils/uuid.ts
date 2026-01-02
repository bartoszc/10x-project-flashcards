/**
 * Validates if a string is a valid UUID format.
 * Supports UUID versions 1-5.
 *
 * @param value - String to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
