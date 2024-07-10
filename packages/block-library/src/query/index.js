/**
 * WordPress dependencies
 */
import { loop as icon } from '@wordpress/icons';
import { subscribe, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	registerBlockVariation,
	unregisterBlockVariation,
} from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	example: {
		viewportWidth: 650,
		attributes: {
			namespace: 'core/posts-list',
			query: {
				perPage: 4,
				pages: 1,
				offset: 0,
				postType: 'post',
				order: 'desc',
				orderBy: 'date',
				author: '',
				search: '',
				sticky: 'exclude',
				inherit: false,
			},
		},
		innerBlocks: [
			{
				name: 'core/post-template',
				attributes: {
					layout: {
						type: 'grid',
						columnCount: 2,
					},
				},
				innerBlocks: [
					{
						name: 'core/post-title',
					},
					{
						name: 'core/post-date',
					},
					{
						name: 'core/post-excerpt',
					},
				],
			},
		],
	},
	save,
	variations,
	deprecated,
};

const previousPostTypes = [];
let haltSubscribing = false;

const keywords = {
	post: [ 'blog' ],
};

subscribe( () => {
	if ( haltSubscribing ) {
		return;
	}
	const { getPostTypes } = select( coreStore );
	const excludedPostTypes = [ 'attachment' ];
	const filteredPostTypes = ( getPostTypes( { per_page: -1 } ) ?? [] ).filter(
		( { viewable, slug } ) =>
			viewable && ! excludedPostTypes.includes( slug )
	);

	for ( const postType of previousPostTypes ) {
		if ( ! filteredPostTypes.includes( postType ) ) {
			haltSubscribing = true;
			unregisterBlockVariation( name, postType.slug );
			haltSubscribing = false;
		}
	}

	for ( const postType of filteredPostTypes ) {
		if ( ! previousPostTypes.includes( postType ) ) {
			haltSubscribing = true;
			registerBlockVariation( name, {
				name: postType.slug,
				title: sprintf(
					/* translators: %s: post type */
					__( '%s Query Loop' ),
					postType.labels.singular_name
				),
				attributes: {
					query: {
						postType: postType.slug,
					},
				},
				keywords: keywords[ postType.slug ] ?? [],
			} );
			haltSubscribing = false;
		}
	}
} );

export const init = () => initBlock( { name, metadata, settings } );
