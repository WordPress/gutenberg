/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DeferredOption from './deferred';

export default compose(
	withSelect( ( select ) => ( {
		isChecked: select( 'core/nux' ).areTipsEnabled(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { enableTips, disableTips } = dispatch( 'core/nux' );
		return {
			onChange: ( isEnabled ) => ( isEnabled ? enableTips() : disableTips() ),
		};
	} )
)(
	// Using DeferredOption here means enableTips() is called when the Options
	// modal is dismissed. This stops the NUX guide from appearing above the
	// Options modal, which looks totally weird.
	DeferredOption
);
