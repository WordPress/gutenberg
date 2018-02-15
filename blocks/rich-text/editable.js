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
		deprecated( 'Editable', '2.5', 'wp.blocks.RichText', 'Gutenberg' );
	}
}

export default Editable;
