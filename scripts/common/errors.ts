// TODO: extract all to tanaris

/**
 * Returns `true` iff `value` is an `errorType` (defaults to `Error`, but can
 * specify a subtype like `RangeError`) _and_ `value.message` is not an empty
 * string. Otherwise, returns `false`.
 *
 * @category Predicates
 *
 * @example isErrorWithMessage(new Error("reason")); //=> true
 * @example isErrorWithMessage(new Error()); //=> false (no message)
 * @example isErrorWithMessage("reason"); //=> false (not an Error)
 *
 * @example isErrorWithMessage(new TypeError("reason"), TypeError); //=> true
 * @example isErrorWithMessage(new TypeError("reason"), RangeError); //=> false
 */
export const isErrorWithMessage = (
  value: unknown,
  errorType: ErrorConstructor = Error
): value is Error => value instanceof errorType && value.message !== "";

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
