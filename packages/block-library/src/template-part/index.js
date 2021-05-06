/**
 * External dependencies
 */
import { startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: layout,
	__experimentalLabel: ( { slug, theme } ) => {
		// Attempt to find entity title if block is a template part.
		// Require slug to request, otherwise entity is uncreated and will throw 404.
		if ( ! slug ) {
			return;
		}

		const entity = select( coreDataStore ).getEntityRecord(
			'postType',
			'wp_template_part',
			theme + '//' + slug
		);
		if ( ! entity ) {
			return;
		}

		return startCase( entity.title?.rendered || entity.slug );
	},
	edit,
};
