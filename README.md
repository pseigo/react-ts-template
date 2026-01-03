# Unnamed Project

A template for client-side React/TypeScript web projects.


## Rename the project

This project has a package script called `rename` that can recursively
find-and-replace all occurrences of the project name with a new one.

By default, it interactively presents proposed file content replacements, file
renames and directory renames before applying the changes.

1. Run `npm install` to install dependencies.
2. Run `npm run rename -- --help` for documentation. See: OPTIONS, EXAMPLES
3. Run `npm run rename --` with the desired options. Follow instructions and
   review changes before applying to ensure names are correct.
4. Review and commit changes.
    - `git add --all`; `git status`; `git diff --staged`;
      `git commit -m "Rename project to [...]"`; `git push`


## Development server

To start the development server:

1. Run `npm install` to install dependencies.
2. Start the build watchers and local server with `npm run dev-server`.

Now you can visit [`localhost:7878`](http://localhost:7878) from your browser.


## License

All files and documentation without an explicit license identifier are released
under the _MIT-0_ ("MIT No Attribution") license. Please see the `LICENSE` file.

Otherwise, files containing (usually near the start of the file) a license
comment or "SPDX-License-Identifier" are distributed under that license and
MUST retain the respective copyright attribution and license notice.

---

In other words, most of the code in this template does _not_ require
attribution. You are free to make this template your own in accordance with
the respective licenses. Have fun!
