/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

/**
 * List of blocks and block attributes that can be bound.
 */
const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'id', 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget', 'rel' ],
};

/**
 * Based on the given block name,
 * check if it is possible to bind the block.
 *
 * @param {string} blockName - The block name.
 * @return {boolean} Whether it is possible to bind the block to sources.
 */
export function canBindBlock( blockName ) {
	return blockName in BLOCK_BINDINGS_ALLOWED_BLOCKS;
}

/**
 * Based on the given block name and attribute name,
 * check if it is possible to bind the block attribute.
 *
 * @param {string} blockName     - The block name.
 * @param {string} attributeName - The attribute name.
 * @return {boolean} Whether it is possible to bind the block attribute.
 */
export function canBindAttribute( blockName, attributeName ) {
	return (
		canBindBlock( blockName ) &&
		BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ].includes( attributeName )
	);
}

/**
 * Process the block attributes and replace them with the values obtained from the bindings.
 *
 * @param {Object} attributes   - The block attributes to process.
 * @param {string} clientId     - The block clientId.
 * @param {string} blockName    - The block name.
 * @param {Object} blockContext - The block context, which is needed for the binding sources.
 * @param {Object} registry     - The data registry.
 *
 * @return {Object} The new attributes object with the bindings values.
 */
export function transformBlockAttributesWithBindingsValues(
	attributes,
	clientId,
	blockName,
	blockContext,
	registry
) {
	const bindings = attributes?.metadata?.bindings;
	if ( ! bindings ) {
		return attributes;
	}

	const sources = unlock(
		registry.select( blocksStore )
	).getAllBlockBindingsSources();

	const newAttributes = { ...attributes };

	for ( const [ attributeName, boundAttribute ] of Object.entries(
		bindings
	) ) {
		const source = sources[ boundAttribute.source ];
		if (
			! source?.getValue ||
			! canBindAttribute( blockName, attributeName )
		) {
			continue;
		}

		const args = {
			registry,
			context: blockContext,
			clientId,
			attributeName,
			args: boundAttribute.args,
		};

		newAttributes[ attributeName ] = source.getValue( args );

		if ( newAttributes[ attributeName ] === undefined ) {
			if ( attributeName === 'url' ) {
				newAttributes[ attributeName ] = null;
			} else {
				newAttributes[ attributeName ] =
					source.getPlaceholder?.( args );
			}
		}
	}

	return newAttributes;
}
