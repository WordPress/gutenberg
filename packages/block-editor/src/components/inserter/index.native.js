/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, ToolbarButton, Dashicon } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

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

		this.state = {
			shouldInsertBefore: false,
		};

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
		} = this.props;
		if ( showSeparator && isOpen ) {
			return <BlockInsertionPoint />;
		}
		const style = getStylesFromColorScheme( styles.addBlockButton, styles.addBlockButtonDark );

		const onPress = () => {
			this.setState( { shouldInsertBefore: false }, () => {
				onToggle();
			} );
		};

		const onLongPress = () => {
			this.setState( { shouldInsertBefore: true }, () => {
				onToggle();
			} );
		};

		return renderToggle( { onToggle: onPress, isOpen, disabled, style, onLongPress } );
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
		const {
			destinationRootClientId,
			clientId,
			isAppender,
			insertionIndexBefore,
			insertionIndexDefault,
		} = this.props;
		const { shouldInsertBefore } = this.state;

		return (
			<InserterMenu
				isOpen={ isOpen }
				onSelect={ onClose }
				onDismiss={ onClose }
				rootClientId={ destinationRootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				isDefaultInsert={ ! shouldInsertBefore }
				insertionIndex={
					shouldInsertBefore ? insertionIndexBefore : insertionIndexDefault
				}
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
			getBlockOrder,
			getBlockIndex,
			getBlock,
		} = select( 'core/block-editor' );

		let destinationRootClientId = rootClientId;

		function getDefaultInsertionIndex() {
			const {
				isPostTitleSelected,
			} = select( 'core/editor' );

			// if post title is selected insert as first block
			if ( isPostTitleSelected() ) {
				return 0;
			}

			// If the clientId is defined, we insert at the position of the block.
			if ( clientId ) {
				return getBlockIndex( clientId, destinationRootClientId );
			}

			// If there a selected block,
			const end = getBlockSelectionEnd();
			// `end` argument (id) can refer to the component which is removed
			// due to pressing `undo` button, that's why we need to check
			// if `getBlock( end) is valid, otherwise `null` is passed
			if ( ! isAppender && end && getBlock( end ) ) {
				// and the last selected block is unmodified (empty), it will be replaced
				if ( isUnmodifiedDefaultBlock( getBlock( end ) ) ) {
					return getBlockIndex( end, destinationRootClientId );
				}

				// we insert after the selected block.
				return getBlockIndex( end, destinationRootClientId ) + 1;
			}

			// Otherwise, we insert at the end of the current rootClientId
			return getBlockOrder( destinationRootClientId ).length;
		}

		let insertionIndexBefore = 0;
		let insertionIndexAfter = getBlockOrder( destinationRootClientId ).length;

		let isAnyBlockSelected = false;
		const end = getBlockSelectionEnd();
		if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
			if ( end ) {
				destinationRootClientId = getBlockRootClientId( end );
				insertionIndexBefore = getBlockIndex( end, destinationRootClientId );
				insertionIndexAfter = getBlockIndex( end, destinationRootClientId ) + 1;
				isAnyBlockSelected = true;
			}
		}

		return {
			destinationRootClientId,
			insertionIndexDefault: getDefaultInsertionIndex(),
			insertionIndexBefore,
			insertionIndexAfter,
			isAnyBlockSelected,
		};
	} ),

	withPreferredColorScheme,
] )( Inserter );
