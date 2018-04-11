#!/bin/bash

# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")"
cd ..

# Sources
BLOCKS_GRAMMAR_PATH="blocks/api/post.pegjs"
GRAMMAR_GRAMMAR_PATH="lib/grammar-grammar.pegjs"

# Target
GRAMMAR_DOC="docs/grammar.md"

# Generate grammar parser
PARSER_PATH=$(mktemp)
npx pegjs -o $PARSER_PATH $GRAMMAR_GRAMMAR_PATH

# Generate public grammar document
cat > $GRAMMAR_DOC <<EOF
# The Gutenberg block grammar

<style>
	dl { display: flex; flex-wrap: wrap; font-size: 110%; }
	dt, dd { flex: 40%; margin-bottom: 1em; }
	dt { text-align: right; font-style: italic; font-size: 105%; }
	dd header { font-weight: bold; }
	pre { margin: 0; }
</style>
EOF

node -p "
	const fs = require( 'fs' );
	const parser = require( '$PARSER_PATH' );
	const grammar = fs.readFileSync( '$BLOCKS_GRAMMAR_PATH', 'utf8' );

	function escapeEntities( string ) {
		return string.replace( /\&/g, '&amp;' ).replace( /</g, '&lt;' );
	}

	function formatRule( rule ) {
		// Break template literal to avoid injecting indentation
		return \`<dt>\${ rule.displayName }</dt>\` +
		\`<dd><pre><header>\${ rule.name }</header>  = \` +
		\`\${ escapeEntities( rule.expression ) }</pre></dd>\`;
	}

	\`<dl>\${ parser.parse( grammar ).map( formatRule ).join( '' ) }</dl>\`
" >> $GRAMMAR_DOC

# Clean up
rm $PARSER_PATH
