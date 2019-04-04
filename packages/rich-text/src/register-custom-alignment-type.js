/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

export function registerCustomAlignmentType( name, settings ) {
	settings = {
		name,
		...settings,
	};

	dispatch( 'core/rich-text' ).addCustomAlignmentTypes( settings );
}
