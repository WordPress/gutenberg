/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export function InlineTip( { isVisible, className, onRemove, children } ) {
	if ( ! isVisible ) {
		return null;
	}

	return (
		<Notice className={ className } onRemove={ onRemove }>
			{ children }
		</Notice>
	);
}

export default compose(
	withSelect( ( select, { tipId } ) => ( {
		isVisible: select( 'core/nux' ).isTipVisible( tipId ),
	} ) ),
	withDispatch( ( dispatch, { tipId } ) => {
		const { disableTips, dismissTip } = dispatch( 'core/nux' );

		return {
			onRemove() {
				// Disable reason: We don't yet have a <Confirm> component. One day!
				// eslint-disable-next-line no-alert
				if ( window.confirm( __( 'Would you like to disable tips like these in the future? ' ) ) ) {
					disableTips();
				} else {
					dismissTip( tipId );
				}
			},
		};
	} )
)( InlineTip );
