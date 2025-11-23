// TODO: extract all to tanaris

/**
 * Returns `true` iff `value` is some string other than `""`,
 * otherwise `false`.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}
