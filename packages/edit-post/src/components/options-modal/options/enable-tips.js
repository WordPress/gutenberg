/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BaseOption from './base';

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
)( BaseOption );
