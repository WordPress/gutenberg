/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/query-title' ],
			transform: ( attributes ) => {
				return createBlock( 'core/post-title', {
					textAlign: attributes.textAlign,
					level: attributes.level || 2,
					style: attributes.style || {},
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/query-title' ],
			name: 'archive-title',
			title: __( 'Archive Title' ),
			transform: ( attributes ) => {
				return createBlock( 'core/query-title', {
					textAlign: attributes.textAlign,
					level: attributes.level || 1,
					type: 'archive',
					showPrefix: true,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/query-title' ],
			name: 'search-title',
			title: __( 'Search Results Title' ),
			transform: ( attributes ) => {
				return createBlock( 'core/query-title', {
					textAlign: attributes.textAlign,
					level: attributes.level || 1,
					type: 'search',
					showPrefix: true,
					showSearchTerm: true,
				} );
			},
		},
	],
};

export default transforms;
