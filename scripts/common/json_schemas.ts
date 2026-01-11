/*
 * react-ts-template/scripts/common/json_schemas.ts
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

import Ajv, {
  type DefinedError as AjvDefinedError,
  type JSONSchemaType,
} from "ajv";
import addAjvFormats from "ajv-formats";
//import ajvJsonSchemaDraft7MetaSchema from "ajv/dist/refs/json-schema-draft-07.json";
import { Type } from "typebox";

export type TypeBoxObjectSchema<
  SchemaProperties extends Type.TProperties = Type.TProperties,
> = Type.TObject<SchemaProperties>;

/**
 * Shared ajv instance for all scripts to use.
 *
 * > **Use single Ajv instance**
 * >
 * > It is recommended to use a single Ajv instance for the whole application,
 * > so if you use validation in more than one module, you should:
 * >
 * > - require Ajv in a separate module responsible for validation
 * > - compile all validators there
 * > - export them to be used in multiple modules of your application
 * >
 * > -- https://ajv.js.org/guide/managing-schemas.html#compiling-during-initialization
 * >  (retrieved 2025-11-21)
 */
export const ajv = new Ajv();
addAjvFormats(ajv);
//ajv.addMetaSchema(ajvJsonSchemaDraft7MetaSchema);

export function ajvErrorToMessage(error: AjvDefinedError): string {
  // TODO: Is there a better/more standard/robust way to construct a readable
  //  string describing the error in natural language, given how many possible
  //  JSON Schema validation errors there are?

  if (error.instancePath !== "") {
    return `property '${error.instancePath}' ${error.message}`;
  }
  return error.message ?? "is invalid (unknown cause)";
}
