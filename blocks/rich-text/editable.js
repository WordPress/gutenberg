/**
 * Internal dependencies
 */
import RichText from './';

class Editable extends RichText {
	constructor() {
		super( ...arguments );
		// eslint-disable-next-line no-console
		console.warn( 'Editable is deprecated, use wp.blocks.RichText instead.' );
	}
}

export default Editable;
