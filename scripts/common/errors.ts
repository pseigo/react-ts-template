/*
 * react-ts-template/scripts/common/errors.ts
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Peyton Seigo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

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
