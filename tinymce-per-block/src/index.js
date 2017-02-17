/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * Internal dependencies
 */
import * as parsers from 'parsers';
import * as renderers from 'renderers';
import * as serializers from 'serializers';
import 'assets/stylesheets/main.scss';
import 'blocks/text-block';
import 'blocks/image-block';

function render( content, initialParsed = {} ) {
	forEach( renderers, ( renderer, type ) => {
		const parser = parsers[ type ];
		const targetNode = document.getElementById( type );

		let parsedContent;
		if ( initialParsed[ type ] ) {
			parsedContent = initialParsed[ type ];
		} else if ( parser ) {
			parsedContent = parser.parse( content );
		} else {
			parsedContent = content;
		}

		// TODO: Consider whether there's a better way to (a) account for re-
		// render during focusOut of block and (b) batch accumulated changes

		function onChange( nextParsedContent ) {
			const serializer = serializers[ type ];

			let nextContent = nextParsedContent;
			if ( serializer ) {
				nextContent = serializer.serialize( nextContent );
			}

			render( nextContent, {
				[ type ]: nextParsedContent
			} );
		}

		renderer( parsedContent, targetNode, onChange );
	} );
}

render( window.content );
