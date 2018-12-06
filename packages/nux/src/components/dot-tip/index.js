/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import {
	Button,
	IconButton,
	KeyboardShortcuts,
	Popover,
	Tooltip,
	withSpokenMessages,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';

function stopEventPropagation( event ) {
	// Tips are often nested within buttons. We stop propagation so that clicking
	// on a tip doesn't result in the button being clicked.
	event.stopPropagation();
}

export class DotTip extends Component {
	constructor( { isCollapsible } ) {
		super( ...arguments );

		this.toggleIsOpen = this.toggleIsOpen.bind( this );

		this.state = {
			isOpen: ! isCollapsible,
		};
	}

	componentDidMount() {
		const { isCollapsible, shortcut, title, debouncedSpeak } = this.props;

		if ( isCollapsible && shortcut && shortcut.raw && shortcut.ariaLabel && title ) {
			debouncedSpeak(
				sprintf( __( 'Press “%s” to open the tip for “%s”.' ), shortcut.ariaLabel, title )
			);
		}
	}

	toggleIsOpen( event ) {
		stopEventPropagation( event );

		if ( this.props.isCollapsible ) {
			this.setState( { isOpen: ! this.state.isOpen } );
		}
	}

	render() {
		const {
			children,
			className,
			hasNextTip,
			isCollapsible,
			isVisible,
			title,
			onDisable,
			onDismiss,
			shortcut,
		} = this.props;
		const { isOpen } = this.state;

		if ( ! isVisible ) {
			return null;
		}

		let classes = 'nux-dot-tip';
		if ( className ) {
			classes += ` ${ className }`;
		}

		let label;
		if ( title ) {
			label = isOpen ?
				sprintf( __( 'Close tip for “%s”' ), title ) :
				sprintf( __( 'Open tip for “%s”' ), title );
		} else {
			label = isOpen ? __( 'Close tip' ) : __( 'Open tip' );
		}

		let popover = null;
		if ( isOpen ) {
			popover = (
				<Popover
					className="nux-dot-tip__popover"
					position="middle right"
					noArrow
					focusOnMount="container"
					role="dialog"
					aria-label={ __( 'Editor tips' ) }
					onClick={ stopEventPropagation }
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

		return isCollapsible ? (
			<Tooltip text={ label } shortcut={ shortcut && shortcut.display }>
				<button className={ classes } aria-label={ label } onClick={ this.toggleIsOpen }>
					{ shortcut && shortcut.raw && (
						<KeyboardShortcuts
							shortcuts={ {
								[ shortcut.raw ]: this.toggleIsOpen,
							} }
						/>
					) }
					{ popover }
				</button>
			</Tooltip>
		) : (
			<div className={ classes }>{ popover }</div>
		);
	}
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
	withSpokenMessages
)( DotTip );
