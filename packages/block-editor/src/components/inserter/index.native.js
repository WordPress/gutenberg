/**
 * External dependencies
 */
import { AccessibilityInfo, Platform } from 'react-native';
import { delay } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, ToolbarButton, Picker } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import {
	Icon,
	plusCircle,
	plusCircleFilled,
	insertAfter,
	insertBefore,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import InserterMenu from './menu';
import BlockInsertionPoint from '../block-list/insertion-point';
import { store as blockEditorStore } from '../../store';

const VOICE_OVER_ANNOUNCEMENT_DELAY = 1000;

const defaultRenderToggle = ( {
	canViewEditorOnboarding,
	onToggle,
	disabled,
	style,
	onLongPress,
} ) => (
	<ToolbarButton
		title={
			canViewEditorOnboarding
				? __( 'Tap to add content' )
				: __( 'Add block' )
		}
		icon={
			<Icon
				icon={ plusCircleFilled }
				style={ style }
				color={ style.color }
			/>
		}
		showTooltip={ canViewEditorOnboarding }
		tooltipPosition="top right"
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
		this.renderInserterToggle = this.renderInserterToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	getInsertionOptions() {
		const addBeforeOption = {
			value: 'before',
			label: __( 'Add Block Before' ),
			icon: plusCircle,
		};

		const replaceCurrentOption = {
			value: 'replace',
			label: __( 'Replace Current Block' ),
			icon: plusCircleFilled,
		};

		const addAfterOption = {
			value: 'after',
			label: __( 'Add Block After' ),
			icon: plusCircle,
		};

		const addToBeginningOption = {
			value: 'start',
			label: __( 'Add To Beginning' ),
			icon: insertBefore,
		};

		const addToEndOption = {
			value: 'end',
			label: __( 'Add To End' ),
			icon: insertAfter,
		};

		const { isAnyBlockSelected, isSelectedBlockReplaceable } = this.props;
		if ( isAnyBlockSelected ) {
			if ( isSelectedBlockReplaceable ) {
				return [
					addToBeginningOption,
					addBeforeOption,
					replaceCurrentOption,
					addAfterOption,
					addToEndOption,
				];
			}
			return [
				addToBeginningOption,
				addBeforeOption,
				addAfterOption,
				addToEndOption,
			];
		}
		return [ addToBeginningOption, addToEndOption ];
	}

	getInsertionIndex( insertionType ) {
		const {
			insertionIndexDefault,
			insertionIndexStart,
			insertionIndexBefore,
			insertionIndexAfter,
			insertionIndexEnd,
		} = this.props;
		if ( insertionType === 'start' ) {
			return insertionIndexStart;
		}
		if ( insertionType === 'before' || insertionType === 'replace' ) {
			return insertionIndexBefore;
		}
		if ( insertionType === 'after' ) {
			return insertionIndexAfter;
		}
		if ( insertionType === 'end' ) {
			return insertionIndexEnd;
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
		this.onInserterToggledAnnouncement( isOpen );
	}

	onInserterToggledAnnouncement( isOpen ) {
		AccessibilityInfo.fetch().done( ( isEnabled ) => {
			if ( isEnabled ) {
				const isIOS = Platform.OS === 'ios';
				const announcement = isOpen
					? __( 'Scrollable block menu opened. Select a block.' )
					: __( 'Scrollable block menu closed.' );
				delay(
					() =>
						AccessibilityInfo.announceForAccessibility(
							announcement
						),
					isIOS ? VOICE_OVER_ANNOUNCEMENT_DELAY : 0
				);
			}
		} );
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
	renderInserterToggle( { onToggle, isOpen } ) {
		const {
			canViewEditorOnboarding,
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
					canViewEditorOnboarding,
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
	 * @param {boolean}  options.isOpen  Whether dropdown is currently open.
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
				renderToggle={ this.renderInserterToggle }
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
			getSettings: getBlockEditorSettings,
		} = select( blockEditorStore );

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
			const {
				__experimentalShouldInsertAtTheTop: shouldInsertAtTheTop,
			} = getBlockEditorSettings();

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

		const insertionIndexStart = 0;

		const insertionIndexBefore = isAnyBlockSelected
			? selectedBlockIndex
			: insertionIndexStart;

		const insertionIndexAfter = isAnyBlockSelected
			? selectedBlockIndex + 1
			: endOfRootIndex;

		const insertionIndexEnd = endOfRootIndex;

		return {
			canViewEditorOnboarding: getBlockEditorSettings()
				.canViewEditorOnboarding,
			destinationRootClientId,
			insertionIndexDefault: getDefaultInsertionIndex(),
			insertionIndexBefore,
			insertionIndexAfter,
			insertionIndexStart,
			insertionIndexEnd,
			isAnyBlockSelected: !! isAnyBlockSelected,
			isSelectedBlockReplaceable: isSelectedUnmodifiedDefaultBlock,
		};
	} ),

	withPreferredColorScheme,
] )( Inserter );
