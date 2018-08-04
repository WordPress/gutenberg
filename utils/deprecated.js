/**
 * External dependencies
 */
import { groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { decodeEntities as decodeEntitiesSource } from '@wordpress/html-entities';
import deprecated from '@wordpress/deprecated';

/**
 * Returns terms in a tree form.
 *
 * @param {Array} flatTerms  Array of terms in flat format.
 *
 * @return {Array} Array of terms in tree format.
 */
export function buildTermsTree( flatTerms ) {
	deprecated( 'wp.utils.buildTermsTree', {
		version: '3.5',
		plugin: 'Gutenberg',
	} );
	const termsByParent = groupBy( flatTerms, 'parent' );
	const fillWithChildren = ( terms ) => {
		return terms.map( ( term ) => {
			const children = termsByParent[ term.id ];
			return {
				...term,
				children: children && children.length ?
					fillWithChildren( children ) :
					[],
			};
		} );
	};

	return fillWithChildren( termsByParent[ '0' ] || [] );
}

// entities
export function decodeEntities( html ) {
	deprecated( 'wp.utils.decodeEntities', {
		version: '3.5',
		alternative: 'wp.htmlEntities.decodeEntities',
		plugin: 'Gutenberg',
	} );
	return decodeEntitiesSource( html );
}
