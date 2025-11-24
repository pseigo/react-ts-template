// TODO: extract all to tanaris

/**
 * Returns `true` iff `value` is an `Error` _and_ `value.message` is not an
 * empty string. Otherwise, returns `false`.
 *
 * @category Predicates
 *
 * @example isErrorWithMessage(new Error("reason")); //=> true
 * @example isErrorWithMessage(new Error()); //=> false (no message)
 * @example isErrorWithMessage("reason"); //=> false (not an Error)
 */
export const isErrorWithMessage = (value: unknown): value is Error =>
  value instanceof Error && value.message !== "";

/**
 * Returns `error.message` if `error` is an `Error` _and_ `error.message` is
 * not an empty string. Otherwise, returns `fallback`.
 *
 * @category Transformers
 *
 * @example errorMessageWithFallback(new Error("reason"), "unknown"); //=> "reason"
 * @example errorMessageWithFallback(new Error(), "unknown"); //=> "unknown"
 */
export const errorMessageWithFallback = (
  error: unknown,
  fallback: string
): string => (isErrorWithMessage(error) && error.message) || fallback;
