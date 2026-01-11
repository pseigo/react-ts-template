# Unnamed Project

A template for client-side React/TypeScript web projects.


## Rename the project

This project has a package script called `rename` that can recursively
find-and-replace all occurrences of the project name with a new one. By
default, it interactively presents proposed file content replacements, file
renames and directory renames before applying the changes.

To rename the project:

1. Run `npm install` to install dependencies.
2. Run `npm run rename -- --help` for documentation. See: OPTIONS, EXAMPLES
3. Commit, stash, or reset uncommitted changes so the git working tree is clean. Running `git status` should print something like "nothing to commit, working tree clean".
4. Run `npm run rename --` with the desired options, then follow the on-screen instructions. Review proposed changes before applying to ensure names are correct.
    - Optional: If you mistakenly apply the wrong names, you can undo all uncommitted changes with `git reset --hard`; be careful, this will erase ALL uncommitted changes, including anything you didn't commit, stash or reset in step (3)!
5. Review and commit changes.
    - `git add --all`; `git status`; `git diff --staged`;
      `git commit -m "Rename project to [...]"`; `git push`


## Development server

To start the development server:

1. Run `npm install` to install dependencies.
2. Start the build watchers and local server with `npm run dev-server`.

Now you can visit [`localhost:7878`](http://localhost:7878) from your browser.


## Contributing

See [`docs/internal/contributing.md`](./docs/internal/contributing.md).


## License

All files and documentation without an explicit license identifier in the
source code or artifact are released under the _MIT-0_ ("MIT No Attribution")
license; please see the `LICENSE` file for the legal language.

Otherwise, files containing (usually near the start of the file) a license
comment or "SPDX-License-Identifier" are distributed under that license and
MUST retain the respective copyright attributions and license notices.

You are _not_ required to provide additional attribution for the template
itself (e.g., in the typical aggregated "Open Source Licenses" page or panel).
You _may_ if you wish to show your support for the project.

Otherwise, you are free to make this template your own for any purpose, in
accordance with the respective licenses. Have fun!

