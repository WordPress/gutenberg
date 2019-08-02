/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Notice, Modal, Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export function InlineTip( {
	children,
	className,
	isTipVisible,
	onDisableTips,
	onDismissTip,
} ) {
	const [ isConfirmationVisible, setIsConfirmationVisible ] = useState( false );

	const openConfirmation = () => setIsConfirmationVisible( true );
	const closeConfirmation = () => setIsConfirmationVisible( false );

	const dismissTip = () => {
		onDismissTip();
		closeConfirmation();
	};

	const disableTips = () => {
		onDisableTips();
		closeConfirmation();
	};

	return (
		<>
			{ isTipVisible && (
				<Notice
					className={ classnames( 'nux-inline-tip', className ) }
					onRemove={ openConfirmation }
				>
					{ children }
				</Notice>
			) }

			{ isConfirmationVisible && (
				<Modal
					className="nux-hide-tips-confirmation"
					title={ __( 'Hide Tips' ) }
					onRequestClose={ closeConfirmation }
				>
					{ __( 'Would you like to disable tips like these in the future?' ) }
					<div className="nux-hide-tips-confirmation__buttons">
						<Button isDefault isLarge onClick={ dismissTip }>
							{ __( 'No' ) }
						</Button>
						<Button isPrimary isLarge onClick={ disableTips }>
							{ __( 'Disable Tips' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
}

export default compose(
	withSelect( ( select, { tipId } ) => ( {
		isTipVisible: select( 'core/nux' ).isTipVisible( tipId ),
	} ) ),
	withDispatch( ( dispatch, { tipId } ) => {
		const { disableTips, dismissTip } = dispatch( 'core/nux' );
		return {
			onDismissTip: () => dismissTip( tipId ),
			onDisableTips: disableTips,
		};
	} )
)( InlineTip );
