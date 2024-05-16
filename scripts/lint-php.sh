#!/bin/bash

./vendor/bin/phpcs --standard=phpcs.xml.dist

for dir in ./plugins/*/
do
	if [ -d "$dir" ] && [ -f "$dir/phpcs.xml.dist" ]; then
			./vendor/bin/phpcs --standard="$dir/phpcs.xml.dist"
	fi
done
