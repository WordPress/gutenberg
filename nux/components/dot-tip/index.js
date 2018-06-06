/**
 * External dependencies
 */
import { defer } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createRef, compose } from '@wordpress/element';
import { Popover, Button, IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

export class DotTip extends Component {
	constructor() {
		super( ...arguments );

		this.popoverRef = createRef();
	}

	componentDidMount() {
		if ( this.props.isVisible ) {
			// Force the popover to recalculate its position on the next frame. This is a
			// Temporary workaround to fix the tip not appearing next to the inserter
			// toggle on page load. This happens because the popover calculates its
			// position before <PostTitle> is made visible, resulting in the position
			// being too high on the page.
			defer( () => {
				const popover = this.popoverRef.current;
				const popoverSize = popover.updatePopoverSize();
				popover.computePopoverPosition( popoverSize );
				popover.focus();
			} );
		}
	}

	render() {
		const { children, isVisible, hasNextTip, onDismiss, onDisable } = this.props;

		if ( ! isVisible ) {
			return null;
		}

		return (
			<Popover
				ref={ this.popoverRef }
				className="nux-dot-tip"
				position="middle right"
				noArrow
				focusOnMount
				role="dialog"
				aria-label={ __( 'Gutenberg tips' ) }
				onClose={ onDismiss }
				onClick={ ( event ) => event.stopPropagation() }
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
}

export default compose(
	withSelect( ( select, { id } ) => {
		const { isTipVisible, getAssociatedGuide } = select( 'core/nux' );
		const associatedGuide = getAssociatedGuide( id );
		return {
			isVisible: isTipVisible( id ),
			hasNextTip: !! ( associatedGuide && associatedGuide.nextTipId ),
		};
	} ),
	withDispatch( ( dispatch, { id } ) => {
		const { dismissTip, disableTips } = dispatch( 'core/nux' );
		return {
			onDismiss() {
				dismissTip( id );
			},
			onDisable() {
				disableTips();
			},
		};
	} ),
)( DotTip );
