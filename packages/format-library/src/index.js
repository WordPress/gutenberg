/**
 * WordPress dependencies
 */
import { registerFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import formats from './default-formats';

formats.forEach( ( { name, ...settings } ) =>
	registerFormatType( name, settings )
);
