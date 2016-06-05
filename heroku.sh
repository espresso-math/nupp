#!/usr/bin/env bash
set -e # halt script on error

git add --all
git commit -m "hello"
git push origin heroku