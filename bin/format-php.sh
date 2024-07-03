#!/bin/bash

./vendor/bin/phpcbf --standard=phpcs.xml.dist --report-summary --report-source

for dir in ./plugins/*/
do
	if [ -d "$dir" ] && [ -f "$dir/phpcs.xml.dist" ]; then
			./vendor/bin/phpcbf --standard="$dir/phpcs.xml.dist" --report-summary --report-source
	fi
done
