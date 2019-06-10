/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

const source = {
	name: 'meta',

	synchronize( block, metaValues ) {
		const currentBlockType = getBlockType( block.name );
		let newAttributes;
		forEach( currentBlockType.attributes, ( attributeConfig, attributeName ) => {
			if ( attributeConfig.source === 'meta' ) {
				forEach( metaValues, ( newValue, key ) => {
					if ( attributeConfig.meta === key ) {
						newAttributes = newAttributes || {};
						newAttributes[ attributeName ] = newValue;
					}
				} );
			}
		} );

		if ( ! newAttributes ) {
			return block;
		}

		return {
			...block,
			attributes: {
				...block.attributes,
				...newAttributes,
			},
		};
	},
};

export default source;
