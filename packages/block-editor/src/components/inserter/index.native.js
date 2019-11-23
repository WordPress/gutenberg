/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, ToolbarButton, Dashicon } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import InserterMenu from './menu';
import BlockInsertionPoint from '../block-list/insertion-point';

const defaultRenderToggle = ( { onToggle, disabled, style, onLongPress } ) => (
	<ToolbarButton
		title={ __( 'Add block' ) }
		icon={ ( <Dashicon icon="plus-alt" style={ style } color={ style.color } /> ) }
		onClick={ onToggle }
		extraProps={ {
			hint: __( 'Double tap to add a block' ),
			// testID is present to disambiguate this element for native UI tests. It's not
			// usually required for components. See: https://git.io/JeQ7G.
			testID: 'add-block-button',
			onLongPress,
		} }
		isDisabled={ disabled }
	/>
);

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
		this.renderToggle = this.renderToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	/**
	 * Render callback to display Dropdown toggle element.
	 *
	 * @param {Object}   options
	 * @param {Function} options.onToggle Callback to invoke when toggle is
	 *                                    pressed.
	 * @param {boolean}  options.isOpen   Whether dropdown is currently open.
	 *
	 * @return {WPElement} Dropdown toggle element.
	 */
	renderToggle( { onToggle, isOpen } ) {
		const {
			disabled,
			renderToggle = defaultRenderToggle,
			getStylesFromColorScheme,
			showSeparator,
			onInsertBefore,
		} = this.props;
		if ( showSeparator && isOpen ) {
			return <BlockInsertionPoint />;
		}
		const style = getStylesFromColorScheme( styles.addBlockButton, styles.addBlockButtonDark );
		return renderToggle( { onToggle, isOpen, disabled, style, onLongPress: onInsertBefore } );
	}

	/**
	 * Render callback to display Dropdown content element.
	 *
	 * @param {Object}   options
	 * @param {Function} options.onClose Callback to invoke when dropdown is
	 *                                   closed.
	 *
	 * @return {WPElement} Dropdown content element.
	 */
	renderContent( { onClose, isOpen } ) {
		const { rootClientId, clientId, isAppender } = this.props;

		return (
			<InserterMenu
				isOpen={ isOpen }
				onSelect={ onClose }
				onDismiss={ onClose }
				rootClientId={ rootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
			/>
		);
	}

	render() {
		return (
			<Dropdown
				onToggle={ this.onToggle }
				headerTitle={ __( 'Add a block' ) }
				renderToggle={ this.renderToggle }
				renderContent={ this.renderContent }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { clientId, isAppender, rootClientId } ) => {
		const {
			getBlockRootClientId,
			getBlockSelectionEnd,
		} = select( 'core/block-editor' );

		let destinationRootClientId = rootClientId;
		const end = getBlockSelectionEnd();
		if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
			if ( end ) {
				destinationRootClientId = getBlockRootClientId( end ) || undefined;
			}
		}

		return {
			destinationRootClientId,
			end,
		};
	} ),
	withDispatch( ( dispatch, { isAppender, destinationRootClientId, end }, { select } ) => {
		return {
			onInsertBefore() {
				if ( isAppender ) {
					return;
				}

				let insertionIndex = 0;

				if ( end ) {
					const { getBlockIndex } = select( 'core/block-editor' );
					insertionIndex = getBlockIndex( end, destinationRootClientId );
				}

				const { insertDefaultBlock } = dispatch( 'core/block-editor' );

				insertDefaultBlock(
					undefined,
					destinationRootClientId,
					insertionIndex
				);
			},
		};
	} ),
	withPreferredColorScheme,
] )( Inserter );
