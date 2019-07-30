/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Popover, Button, IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';

function getAnchorRect( anchor ) {
	// The default getAnchorRect() excludes an element's top and bottom padding
	// from its calculation. We want tips to point to the outer margin of an
	// element, so we override getAnchorRect() to include all padding.
	return anchor.parentNode.getBoundingClientRect();
}

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
	if ( ! isVisible ) {
		return null;
	}

	return (
		<Popover
			className="nux-dot-tip"
			position={ position }
			noArrow
			focusOnMount="container"
			getAnchorRect={ getAnchorRect }
			role="dialog"
			aria-label={ __( 'Editor tips' ) }
			onClick={ onClick }
		>
			<p>{ children }</p>
			<p>
				<Button isLink onClick={ onDismiss }>
					{ hasNextTip ? __( 'See next tip' ) : __( 'Got it' ) }
				</Button>
			</p>
			<IconButton
				className="nux-dot-tip__disable"
				icon="no-alt"
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
	} ),
)( DotTip );
