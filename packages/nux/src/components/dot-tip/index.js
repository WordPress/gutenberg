/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import { Popover, Button, IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';

export class DotTip extends Component {
	componentDidMount() {
		this.props.onRegister();
	}

	componentWillUnmount() {
		this.props.onUnregister();
	}

	render() {
		const { children, isVisible, hasNextTip, onDismiss, onDisable } = this.props;

		if ( ! isVisible ) {
			return null;
		}

		return (
			<Popover
				className="nux-dot-tip"
				position="middle right"
				noArrow
				focusOnMount="container"
				role="dialog"
				aria-label={ __( 'Gutenberg tips' ) }
				onClick={ ( event ) => {
					// Tips are often nested within buttons. We stop propagation so that clicking
					// on a tip doesn't result in the button being clicked.
					event.stopPropagation();
				} }
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
	withInstanceId,
	withSelect( ( select, { id, instanceId } ) => {
		const { isTipVisible, getAssociatedGuide } = select( 'core/nux' );
		const associatedGuide = getAssociatedGuide( id );
		return {
			isVisible: isTipVisible( id, instanceId ),
			hasNextTip: !! ( associatedGuide && associatedGuide.nextTipId ),
		};
	} ),
	withDispatch( ( dispatch, { id, instanceId } ) => {
		const {
			registerTipInstance,
			unregisterTipInstance,
			dismissTip,
			disableTips,
		} = dispatch( 'core/nux' );

		return {
			onRegister() {
				registerTipInstance( id, instanceId );
			},
			onUnregister() {
				unregisterTipInstance( id, instanceId );
			},
			onDismiss() {
				dismissTip( id );
			},
			onDisable() {
				disableTips();
			},
		};
	} ),
)( DotTip );
