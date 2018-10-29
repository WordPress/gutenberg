/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { _x, sprintf, __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { resolveSelector } from './utils';

/**
 * Effect handler adding a new term to currently edited post.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export async function addTermToEditedPost( { slug, term } ) {
	const taxonomy = await resolveSelector( 'core', 'getTaxonomy', slug );
	const savedTerm = await dispatch( 'core' ).saveEntityRecord( 'taxonomy', slug, term );
	const terms = select( 'core/editor' ).getEditedPostAttribute( taxonomy.rest_base );

	const termAddedMessage = sprintf(
		_x( '%s added', 'term' ),
		get(
			taxonomy,
			[ 'data', 'labels', 'singular_name' ],
			slug === 'category' ? __( 'Category' ) : __( 'Term' )
		)
	);
	speak( termAddedMessage, 'assertive' );
	dispatch( 'core/editor' ).editPost( { [ taxonomy.rest_base ]: [ ...terms, savedTerm.id ] } );
}
