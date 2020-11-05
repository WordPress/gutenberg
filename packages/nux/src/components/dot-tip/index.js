/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Popover, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { close } from '@wordpress/icons';

function onClick( event ) {
	// Tips are often nested within buttons. We stop propagation so that clicking
	// on a tip doesn't result in the button being clicked.
	event.stopPropagation();
}

export function DotTip( {
	position = 'middle right',
	children,
	isVisible,
	hasNextTip,
	onDismiss,
	onDisable,
} ) {
	const anchorParent = useRef( null );
	const onFocusOutsideCallback = useCallback(
		( event ) => {
			if ( ! anchorParent.current ) {
				return;
			}
			if ( anchorParent.current.contains( event.relatedTarget ) ) {
				return;
			}
			onDisable();
		},
		[ onDisable, anchorParent ]
	);
	if ( ! isVisible ) {
		return null;
	}

	return (
		<Popover
			className="nux-dot-tip"
			position={ position }
			noArrow
			focusOnMount="container"
			shouldAnchorIncludePadding
			role="dialog"
			aria-label={ __( 'Editor tips' ) }
			onClick={ onClick }
			onFocusOutside={ onFocusOutsideCallback }
		>
			<p>{ children }</p>
			<p>
				<Button isLink onClick={ onDismiss }>
					{ hasNextTip ? __( 'See next tip' ) : __( 'Got it' ) }
				</Button>
			</p>
			<Button
				className="nux-dot-tip__disable"
				icon={ close }
				label={ __( 'Disable tips' ) }
				onClick={ onDisable }
			/>
		</Popover>
	);
}

export default compose(
	withSelect( ( select, { tipId } ) => {
		const { isTipVisible, getAssociatedGuide } = select( 'core/nux' );
		const associatedGuide = getAssociatedGuide( tipId );
		return {
			isVisible: isTipVisible( tipId ),
			hasNextTip: !! ( associatedGuide && associatedGuide.nextTipId ),
		};
	} ),
	withDispatch( ( dispatch, { tipId } ) => {
		const { dismissTip, disableTips } = dispatch( 'core/nux' );
		return {
			onDismiss() {
				dismissTip( tipId );
			},
			onDisable() {
				disableTips();
			},
		};
	} )
)( DotTip );
