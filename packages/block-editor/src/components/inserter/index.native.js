/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Dropdown,
	ToolbarButton,
	Dashicon,
	Picker,
} from '@wordpress/components';
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
		icon={
			<Dashicon icon="plus-alt" style={ style } color={ style.color } />
		}
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

export class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
		this.renderToggle = this.renderToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	getInsertionOptions() {
		const addBeforeOption = {
			value: 'before',
			label: __( 'Add Block Before' ),
			icon: 'insert-before',
		};

		const replaceCurrentOption = {
			value: 'replace',
			label: __( 'Replace Current Block' ),
			icon: 'plus-alt',
		};

		const addAfterOption = {
			value: 'after',
			label: __( 'Add Block After' ),
			icon: 'insert-after',
		};

		const addToBeginningOption = {
			value: 'before',
			label: __( 'Add To Beginning' ),
			icon: 'insert-before',
		};

		const addToEndOption = {
			value: 'after',
			label: __( 'Add To End' ),
			icon: 'insert-after',
		};

		const { isAnyBlockSelected, isSelectedBlockReplaceable } = this.props;
		if ( isAnyBlockSelected ) {
			if ( isSelectedBlockReplaceable ) {
				return [
					addBeforeOption,
					replaceCurrentOption,
					addAfterOption,
				];
			}
			return [ addBeforeOption, addAfterOption ];
		}
		return [ addToBeginningOption, addToEndOption ];
	}

	getInsertionIndex( insertionType ) {
		const {
			insertionIndexDefault,
			insertionIndexBefore,
			insertionIndexAfter,
		} = this.props;
		if ( insertionType === 'before' || insertionType === 'replace' ) {
			return insertionIndexBefore;
		}
		if ( insertionType === 'after' ) {
			return insertionIndexAfter;
		}
		return insertionIndexDefault;
	}

	shouldReplaceBlock( insertionType ) {
		const { isSelectedBlockReplaceable } = this.props;
		if ( insertionType === 'replace' ) {
			return true;
		}
		if ( insertionType === 'default' && isSelectedBlockReplaceable ) {
			return true;
		}
		return false;
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
		const style = getStylesFromColorScheme(
			styles.addBlockButton,
			styles.addBlockButtonDark
		);

		const onPress = () => {
			this.setState(
				{
					destinationRootClientId: this.props.destinationRootClientId,
					shouldReplaceBlock: this.shouldReplaceBlock( 'default' ),
					insertionIndex: this.getInsertionIndex( 'default' ),
				},
				onToggle
			);
		};

		const onLongPress = () => {
			if ( this.picker ) {
				this.picker.presentPicker();
			}
		};

		const onPickerSelect = ( insertionType ) => {
			this.setState(
				{
					destinationRootClientId: this.props.destinationRootClientId,
					shouldReplaceBlock: this.shouldReplaceBlock(
						insertionType
					),
					insertionIndex: this.getInsertionIndex( insertionType ),
				},
				onToggle
			);
		};

		return (
			<>
				{ renderToggle( {
					onToggle: onPress,
					isOpen,
					disabled,
					style,
					onLongPress,
				} ) }
				<Picker
					ref={ ( instance ) => ( this.picker = instance ) }
					options={ this.getInsertionOptions() }
					onChange={ onPickerSelect }
					hideCancelButton
				/>
			</>
		);
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
		const { clientId, isAppender } = this.props;
		const {
			destinationRootClientId,
			shouldReplaceBlock,
			insertionIndex,
		} = this.state;
		return (
			<InserterMenu
				isOpen={ isOpen }
				onSelect={ onClose }
				onDismiss={ onClose }
				rootClientId={ destinationRootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				shouldReplaceBlock={ shouldReplaceBlock }
				insertionIndex={ insertionIndex }
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

		const end = getBlockSelectionEnd();
		// `end` argument (id) can refer to the component which is removed
		// due to pressing `undo` button, that's why we need to check
		// if `getBlock( end) is valid, otherwise `null` is passed
		const isAnyBlockSelected = ! isAppender && end && getBlock( end );
		const destinationRootClientId = isAnyBlockSelected
			? getBlockRootClientId( end )
			: rootClientId;
		const selectedBlockIndex = getBlockIndex(
			end,
			destinationRootClientId
		);
		const endOfRootIndex = getBlockOrder( rootClientId ).length;
		const isSelectedUnmodifiedDefaultBlock = isAnyBlockSelected
			? isUnmodifiedDefaultBlock( getBlock( end ) )
			: undefined;

		function getDefaultInsertionIndex() {
			const { getSettings } = select( 'core/block-editor' );

			const {
				__experimentalShouldInsertAtTheTop: shouldInsertAtTheTop,
			} = getSettings();

			// if post title is selected insert as first block
			if ( shouldInsertAtTheTop ) {
				return 0;
			}

			// If the clientId is defined, we insert at the position of the block.
			if ( clientId ) {
				return getBlockIndex( clientId, rootClientId );
			}

			// If there is a selected block,
			if ( isAnyBlockSelected ) {
				// and the last selected block is unmodified (empty), it will be replaced
				if ( isSelectedUnmodifiedDefaultBlock ) {
					return selectedBlockIndex;
				}

				// we insert after the selected block.
				return selectedBlockIndex + 1;
			}

			// Otherwise, we insert at the end of the current rootClientId
			return endOfRootIndex;
		}

		const insertionIndexBefore = isAnyBlockSelected
			? selectedBlockIndex
			: 0;

		const insertionIndexAfter = isAnyBlockSelected
			? selectedBlockIndex + 1
			: endOfRootIndex;

		return {
			destinationRootClientId,
			insertionIndexDefault: getDefaultInsertionIndex(),
			insertionIndexBefore,
			insertionIndexAfter,
			isAnyBlockSelected,
			isSelectedBlockReplaceable: isSelectedUnmodifiedDefaultBlock,
		};
	} ),

	withPreferredColorScheme,
] )( Inserter );
