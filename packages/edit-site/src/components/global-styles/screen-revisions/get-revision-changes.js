/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const translationMap = {
	blocks: __( 'Block styles' ),
	border: __( 'Border' ),
	colors: __( 'Colors' ),
	elements: __( 'Elements' ),
	link: __( 'Links' ),
	layout: __( 'Layout' ),
	spacing: __( 'Spacing' ),
	typography: __( 'Typography' ),
};

/**
 * Returns an array of translated strings describing high level global styles and settings.
 *
 * @param {Object} revision
 * @param {Object} revision.settings Global styles settings.
 * @param {Object} revision.styles   Global styles.
 * @return {string[] | []} An array of translated labels.
 */
export default function getGlobalStylesChanges( {
	settings = {},
	styles = {},
} ) {
	const changes = [];
	if ( Object.keys( settings ).length > 0 ) {
		changes.push( __( 'Global settings' ) );
	}
	Object.keys( styles ).forEach( ( key ) => {
		if ( translationMap[ key ] ) {
			changes.push( translationMap[ key ] );
		}
	} );

	return changes;
}
