#!/bin/sh
# ctags_clean.sh
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

SCRIPT_DIR_PATH="${0%/*}"
SCRIPT_NAME="${0##*/}"

PROJECT_ROOT_DIR_PATH="$SCRIPT_DIR_PATH"/../../..
DEV_ARTIFACTS_DIR_PATH="$PROJECT_ROOT_DIR_PATH"/build-dev
INTERMEDIATE_TAGS_DIR_PATH="$DEV_ARTIFACTS_DIR_PATH"/ctags
TAGS_FILE_PATH="$PROJECT_ROOT_DIR_PATH"/tags

if [ -d "$INTERMEDIATE_TAGS_DIR_PATH" ]; then
  rm -rfv "$INTERMEDIATE_TAGS_DIR_PATH"
fi

if [ -e "$TAGS_FILE_PATH" ] && [ -f "$TAGS_FILE_PATH" ]; then
  rm -v "$TAGS_FILE_PATH"
fi
