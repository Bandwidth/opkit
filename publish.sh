#!/bin/bash


if [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_BRANCH" == "master" ]; then
	cp -Rf out/ $HOME/
	cd $HOME
	git config --global user.email "travis@travis-ci.org"
	git config --global user.name "travis-ci"
	git clone --quiet --branch=gh-pages git@github.com:inetCatapult/opkit.git

	cd opkit
	git rm -rf .
	cp -Rf $HOME/out/* .
	git add -f .
	git commit -m "Generated docs from Travis."
	git push -fq origin gh-pages > /dev/null
fi