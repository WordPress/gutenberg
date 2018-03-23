/**
 * WordPress dependencies
 */
import { deprecated } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import RichText from './';

class Editable extends RichText {
	constructor() {
		super( ...arguments );
		deprecated( 'Editable', {
			version: '2.5',
			alternative: 'wp.blocks.RichText',
			plugin: 'Gutenberg',
		} );
	}
}

export default Editable;
