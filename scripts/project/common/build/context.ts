/**
 * Information about a particular source file and how it should be built. Used
 * by helpers in the 'build' folder.
 */
export interface BuildContext {
  paths: {
    /** Path to the original source code file. */
    sourceFile: string;

    /** Path to a directory containing source code files. */
    sourceDir?: string;

    /** Where to write the compiled artifact file. */
    artifactFile: string;

    /** Directory where the artifact is written to. */
    artifactDir?: string;
  };
}
