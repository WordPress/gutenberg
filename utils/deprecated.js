/**
 * External dependencies
 */
import { groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import * as keycodesSource from '@wordpress/keycodes';
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

// keycodes
const wrapKeycodeFunction = ( source, functionName ) => ( ...args ) => {
	deprecated( `wp.utils.keycodes.${ functionName }`, {
		version: '3.4',
		alternative: `wp.keycodes.${ functionName }`,
		plugin: 'Gutenberg',
	} );
	return source( ...args );
};

const keycodes = { ...keycodesSource, rawShortcut: {}, displayShortcut: {}, isKeyboardEvent: {} };
const modifiers = [ 'primary', 'primaryShift', 'secondary', 'access' ];
keycodes.isMacOS = wrapKeycodeFunction( keycodes.isMacOS, 'isMacOS' );
modifiers.forEach( ( modifier ) => {
	keycodes.rawShortcut[ modifier ] = wrapKeycodeFunction( keycodesSource.rawShortcut[ modifier ], 'rawShortcut.' + modifier );
	keycodes.displayShortcut[ modifier ] = wrapKeycodeFunction( keycodesSource.displayShortcut[ modifier ], 'displayShortcut.' + modifier );
	keycodes.isKeyboardEvent[ modifier ] = wrapKeycodeFunction( keycodesSource.isKeyboardEvent[ modifier ], 'isKeyboardEvent.' + modifier );
} );

export { keycodes };
