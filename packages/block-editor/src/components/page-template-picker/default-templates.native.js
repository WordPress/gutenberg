/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * External dependencies
 */
import { map } from 'lodash';
import memoize from 'memize';

/**
 * Internal dependencies
 */
import { About, Blog, Contact, Portfolio, Services, Team } from './templates';

const defaultTemplates = [ About, Blog, Contact, Portfolio, Services, Team ];

const createInnerBlocks = ( { name, attributes, innerBlocks } ) => {
	return createBlock(
		name,
		attributes,
		map( innerBlocks, createInnerBlocks )
	);
};

const createBlocks = ( template ) => {
	return template.map( ( { name, attributes, innerBlocks } ) => {
		return createBlock(
			name,
			attributes,
			map( innerBlocks, createInnerBlocks )
		);
	} );
};

const parsedTemplates = memoize( () =>
	defaultTemplates.map( ( template ) => ( {
		...template,
		blocks: createBlocks( template.content ),
	} ) )
);

export default parsedTemplates;
