#!/bin/sh
# ctags_gen.sh
# SPDX-License-Identifier: MIT
#
# Copyright (c) 2025 Peyton Seigo
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the “Software”), to
# deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

set -e

# Exit status codes.
S_OK=0
S_ERROR=1

SCRIPT_DIR_PATH="${0%/*}"
SCRIPT_NAME="${0##*/}"

# TODO: Finish ctags gen script
#echo "gen.sh:"
#echo $SCRIPT_DIR_PATH
#echo $SCRIPT_NAME
#exit 0

PROJECT_ROOT_DIR_PATH="$SCRIPT_DIR_PATH"/../../..
DEV_ARTIFACTS_DIR_PATH="$PROJECT_ROOT_DIR_PATH"/_build/dev
INTERMEDIATE_TAGS_DIR_PATH="$DEV_ARTIFACTS_DIR_PATH"/ctags
TAGS_FILE_PATH="$PROJECT_ROOT_DIR_PATH"/tags

CTAGS_COMMON_ARGS="\
  --exclude=_build
  --exclude=_dist
  --exclude=.elixir_ls
  --languages=Elixir,Erlang,JavaScript,TypeScript
  --langmap=JavaScript:+.jsx,TypeScript:+.tsx
  --recurse
  --extras=+q
  --quiet
"

print_help() {
  cat << EOF
usage:
  ${SCRIPT_NAME} [-h | --help] (--all | --project | --deps) [-s | --silent]

options:
  -h | --help     Shows this screen.

  --project       Regenerates "tags" file after refreshing
                  the project's tags. (fast)

  --deps          Regenerates "tags" file after refreshing
                  dependencies' tags. (slow)

  --all           Regenerates "tags" file after refreshing
                  the project's and its dependencies' tags. (slow)

  -s, --silent    Runs without printing anything to stdout. (TODO)


You must pass exactly one of \`--project\`, \`--deps\`, or \`--all\`.

Generates a "tags" file in the project's root directory using the system's
\`ctags\` command. This file allows code editors to search for symbols to enable
actions like "go to definition".

Some editors automatically detect and start using the "tags" file if it
supports ctags files. Otherwise, please search for instructions for your
specific editor.

The "tags" file must be rebuilt anytime symbols in the project change. You can
do this manually by re-running "$SCRIPT_NAME" or with the "watch.sh" script in
the same directory; the latter is called by the project's \`npm run watch\` script.
EOF
}

do_full_rebuild() {
  prepare
  gen_tags_src
  gen_tags_scripts
  gen_tags_test
  gen_tags_deps
  gen_concatenated_tags
}

do_deps_rebuild() {
  prepare
  create_empty_file_if_not_exists "$INTERMEDIATE_TAGS_DIR_PATH"/src.tags
  create_empty_file_if_not_exists "$INTERMEDIATE_TAGS_DIR_PATH"/scripts.tags
  create_empty_file_if_not_exists "$INTERMEDIATE_TAGS_DIR_PATH"/test.tags
  gen_tags_deps
  gen_concatenated_tags
}

do_project_rebuild() {
  prepare
  gen_tags_src
  gen_tags_scripts
  gen_tags_test
  create_empty_file_if_not_exists "$INTERMEDIATE_TAGS_DIR_PATH"/deps.tags
  gen_concatenated_tags
}

prepare() {
  cd "$PROJECT_ROOT_DIR_PATH"
  mkdir -p "$INTERMEDIATE_TAGS_DIR_PATH"
}

create_empty_file_if_not_exists() {
  if ! [ -e "$1" ]; then
    touch "$1"
  fi
}

gen_tags_src() {
  ctags $CTAGS_COMMON_ARGS \
    -f "$INTERMEDIATE_TAGS_DIR_PATH"/src.tags \
    src
}

gen_tags_scripts() {
  ctags $CTAGS_COMMON_ARGS \
    -f "$INTERMEDIATE_TAGS_DIR_PATH"/scripts.tags \
    scripts
}

gen_tags_test() {
  ctags $CTAGS_COMMON_ARGS \
    -f "$INTERMEDIATE_TAGS_DIR_PATH"/test.tags \
    test
}

gen_tags_deps() {
  ctags $CTAGS_COMMON_ARGS \
    --exclude="*bundle.js*" \
    --exclude="*bundle.ts*" \
    --exclude="*min.js*" \
    --exclude="*min.ts*" \
    -f "$INTERMEDIATE_TAGS_DIR_PATH"/deps.tags \
    node_modules
}

gen_concatenated_tags() {
  cat "$INTERMEDIATE_TAGS_DIR_PATH"/src.tags > "$TAGS_FILE_PATH"
  echo >> "$TAGS_FILE_PATH"
  cat "$INTERMEDIATE_TAGS_DIR_PATH"/scripts.tags >> "$TAGS_FILE_PATH"
  echo >> "$TAGS_FILE_PATH"
  cat "$INTERMEDIATE_TAGS_DIR_PATH"/test.tags >> "$TAGS_FILE_PATH"
  echo >> "$TAGS_FILE_PATH"
  cat "$INTERMEDIATE_TAGS_DIR_PATH"/deps.tags >> "$TAGS_FILE_PATH"
  echo "done <3" # TODO: remove
}

# ~~~ Process arguments. ~~~

# 'Help' option overrides all other arguments.
for arg in "$@"; do
  if [ "$arg" = "-h" ] || [ "$arg" = "--help" ]; then
    print_help
    exit $S_OK
  fi
done

if [ $# -eq 0 ]; then
  >&2 echo "error: No options passed."
  echo
  print_help
  exit $S_ERROR
fi

# Parse arguments.
while [ $# -gt 0 ]; do
  case "$1" in
    --all )
      do_full_rebuild
      exit $S_OK
      ;;

    --deps )
      do_deps_rebuild
      exit $S_OK
      ;;

    --project )
      do_project_rebuild
      exit $S_OK
      ;;

    # Options.
    -* )
      >&2 echo "error: Unknown option '$1'."
      exit $S_ERROR
      ;;

    # Non-option arguments.
    * )
      >&2 echo "error: Unknown argument '$1'."
      exit $S_ERROR
      ;;
  esac

  shift 1
done

# ~~~ Generate. ~~~

# TODO: set operation based on --all/--deps/--project, but error exit if more than one is passed. actually do the call after processing all args. e.g., so that `gen.sh --all --invalid-option` fails.
