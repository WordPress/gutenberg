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
	hasDismissedAnyTips,
	isTipVisible,
	onDisableTips,
	onDismissTip,
} ) {
	const [ isConfirmationVisible, setIsConfirmationVisible ] = useState( false );

	const dismissNotice = () => {
		if ( hasDismissedAnyTips ) {
			onDismissTip();
		} else {
			setIsConfirmationVisible( true );
		}
	};

	const closeConfirmation = () => {
		setIsConfirmationVisible( false );
	};

	const dismissConfirmation = () => {
		onDismissTip();
		closeConfirmation();
	};

	const acceptConfirmation = () => {
		onDisableTips();
		closeConfirmation();
	};

	return (
		<>
			{ isTipVisible && (
				<Notice
					className={ classnames( 'nux-inline-tip', className ) }
					onRemove={ dismissNotice }
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
						<Button isDefault isLarge onClick={ dismissConfirmation }>
							{ __( 'No' ) }
						</Button>
						<Button isPrimary isLarge onClick={ acceptConfirmation }>
							{ __( 'Disable Tips' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
}

export default compose(
	withSelect( ( select, { tipId } ) => {
		const { isTipVisible, hasDismissedAnyTips } = select( 'core/nux' );
		return {
			isTipVisible: isTipVisible( tipId ),
			hasDismissedAnyTips: hasDismissedAnyTips(),
		};
	} ),
	withDispatch( ( dispatch, { tipId } ) => {
		const { disableTips, dismissTip } = dispatch( 'core/nux' );
		return {
			onDismissTip: () => dismissTip( tipId ),
			onDisableTips: disableTips,
		};
	} )
)( InlineTip );
