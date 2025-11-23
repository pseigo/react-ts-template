import Ajv, {
  type DefinedError as AjvDefinedError,
  type JSONSchemaType,
} from "ajv";
import addAjvFormats from "ajv-formats";
//import ajvJsonSchemaDraft7MetaSchema from "ajv/dist/refs/json-schema-draft-07.json";

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
