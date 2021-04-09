/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import onFilter from './on-filter';
import scriptRemover from './script-remover';
import { deepFilterHTML } from './utils';
import { getBlockType, getFreeformContentHandlerName } from '../registration';
import { parseWithGrammar } from '../parser';

export function codeHandler( { HTML = '' } ) {
	const freeform = getFreeformContentHandlerName();

	return parseWithGrammar( HTML ).map( ( block ) => {
		const { name } = block;

		// Let TinyMCE handle it
		if ( name === freeform ) {
			return block;
		}

		const blockType = getBlockType( name );
		return {
			...block,
			attributes: mapValues( block.attributes, ( value, key ) => {
				const attributeType = blockType.attributes[ key ];

				if ( attributeType.source === 'html' ) {
					return deepFilterHTML( value, [ scriptRemover, onFilter ] );
				}

				return value;
			} ),
		};
	} );
}
