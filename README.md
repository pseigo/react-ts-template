# Unnamed Project

A template for client-side React/TypeScript web projects.

## TODO: Initial setup

To rename the project:

- Run `npm install` to install dependencies.
- Run `npm run build-dev` to compile helper scripts.

> [!WARNING]
> The next step will modify many files within the project including renaming
> files and directories, and replacing file contents. i.e.,
>
>       "unnamed-project" => "your-project-name",
>       "UnnamedProject => YourProjectName",
>       etc.
>
> It is recommended to start with a **clean work tree** in git to ease code
> review (or reversion if needed). That is: commit, stash, or reset any
> uncommitted changes so `git status` is clean _before_ running
> `rename-project.js`.

- Run `node ./build-dev/scripts/rename-project.js your-project-name YourProjectName`.
- Review and commit the changes.
- Now you may delete `./scripts/rename-project.ts`. If you keep it around, note that it only tries to replace names according to the project template's original file structure. 

## Development server

To start the development server:

- Run `npm install` to install dependencies.
- Start the build watchers and local server with `npm run server-dev`.

Now you can visit [`localhost:7878`](http://localhost:7878) from your browser.

## License

All files and documentation without an explicit license identifier are released
under the _MIT-0_ ("MIT No Attribution") license. Please see the `LICENSE` file.

Otherwise, files containing (usually near the start of the file) a license
comment or "SPDX-License-Identifier" are distributed under that license and
MUST retain the respective copyright attribution.

In other words, most of the code in this template does _not_ require
attribution. You are free to make this template your own in accordance with
the respective licenses. Have fun!
