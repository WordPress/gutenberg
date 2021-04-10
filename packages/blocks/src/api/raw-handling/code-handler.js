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
import {
	getBlockType,
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
} from '../registration';
import { parseWithGrammar } from '../parser';

export function codeHandler( { HTML = '', mode = 'BLOCKS' } ) {
	if ( mode === 'INLINE' ) {
		return deepFilterHTML( HTML, [ scriptRemover, onFilter ] );
	}

	const freeformName = getFreeformContentHandlerName();
	const unregisteredName = getUnregisteredTypeHandlerName();

	return parseWithGrammar( HTML ).map( ( block ) => {
		const { name } = block;

		// Let TinyMCE handle it
		if ( name === freeformName ) {
			return block;
		}

		const blockType = getBlockType( name );
		return {
			...block,
			attributes: mapValues( block.attributes, ( value, key ) => {
				const attributeType = blockType.attributes[ key ];

				if (
					attributeType.source === 'html' ||
					name === unregisteredName
				) {
					return deepFilterHTML( value, [ scriptRemover, onFilter ] );
				}

				return value;
			} ),
		};
	} );
}
