/**
 * External dependencies
 */
import { AccessibilityInfo, Platform, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Dropdown, ToolbarButton, Picker } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import {
	Icon,
	plus,
	plusCircle,
	plusCircleFilled,
	insertAfter,
	insertBefore,
} from '@wordpress/icons';
import { setBlockTypeImpressions } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import InserterMenu from './menu';
import BlockInsertionPoint from '../block-list/insertion-point';
import { store as blockEditorStore } from '../../store';

const VOICE_OVER_ANNOUNCEMENT_DELAY = 1000;

const defaultRenderToggle = ( {
	onToggle,
	disabled,
	style,
	containerStyle,
	onLongPress,
	useExpandedMode,
} ) => {
	// The "expanded mode" refers to the editor's appearance when no blocks
	// are currently selected. The "add block" button has a separate style
	// for the "expanded mode", which are added via the below "expandedModeViewProps"
	// and "expandedModeViewText" variables.
	const expandedModeViewProps = useExpandedMode && {
		icon: <Icon icon={ plus } style={ style } />,
		customContainerStyles: containerStyle,
		fixedRatio: false,
	};
	const expandedModeViewText = (
		<Text style={ styles[ 'inserter-menu__add-block-button-text' ] }>
			{ __( 'Add blocks' ) }
		</Text>
	);

	return (
		<ToolbarButton
			title={ _x(
				'Add block',
				'Generic label for block inserter button'
			) }
			icon={ <Icon icon={ plusCircleFilled } style={ style } /> }
			onClick={ onToggle }
			extraProps={ {
				hint: __( 'Double tap to add a block' ),
				// testID is present to disambiguate this element for native UI tests. It's not
				// usually required for components. See: https://github.com/WordPress/gutenberg/pull/18832#issuecomment-561411389.
				testID: 'add-block-button',
				onLongPress,
			} }
			isDisabled={ disabled }
			{ ...expandedModeViewProps }
		>
			{ useExpandedMode && expandedModeViewText }
		</ToolbarButton>
	);
};

export class Inserter extends Component {
	announcementTimeout;

	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
		this.renderInserterToggle = this.renderInserterToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	componentWillUnmount() {
		clearTimeout( this.announcementTimeout );
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
		const { blockTypeImpressions, onToggle, updateSettings } = this.props;

		if ( ! isOpen ) {
			const impressionsRemain = Object.values(
				blockTypeImpressions
			).some( ( count ) => count > 0 );

			if ( impressionsRemain ) {
				const decrementedImpressions = Object.entries(
					blockTypeImpressions
				).reduce(
					( acc, [ blockName, count ] ) => ( {
						...acc,
						[ blockName ]: Math.max( count - 1, 0 ),
					} ),
					{}
				);

				// Persist block type impression to JavaScript store.
				updateSettings( {
					impressions: decrementedImpressions,
				} );

				// Persist block type impression count to native app store.
				setBlockTypeImpressions( decrementedImpressions );
			}
		}

		// Surface toggle callback to parent component.
		if ( onToggle ) {
			onToggle( isOpen );
		}
		this.onInserterToggledAnnouncement( isOpen );
	}

	onInserterToggledAnnouncement( isOpen ) {
		AccessibilityInfo.isScreenReaderEnabled().then( ( isEnabled ) => {
			if ( isEnabled ) {
				const isIOS = Platform.OS === 'ios';
				const announcement = isOpen
					? __( 'Scrollable block menu opened. Select a block.' )
					: __( 'Scrollable block menu closed.' );
				this.announcementTimeout = setTimeout(
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
			disabled,
			renderToggle = defaultRenderToggle,
			getStylesFromColorScheme,
			showSeparator,
			useExpandedMode,
		} = this.props;
		if ( showSeparator && isOpen ) {
			return <BlockInsertionPoint />;
		}
		const style = useExpandedMode
			? styles[ 'inserter-menu__add-block-button-icon--expanded' ]
			: getStylesFromColorScheme(
					styles[ 'inserter-menu__add-block-button-icon' ],
					styles[ 'inserter-menu__add-block-button-icon--dark' ]
			  );

		const containerStyle = getStylesFromColorScheme(
			styles[ 'inserter-menu__add-block-button' ],
			styles[ 'inserter-menu__add-block-button--dark' ]
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
					shouldReplaceBlock:
						this.shouldReplaceBlock( insertionType ),
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
					containerStyle,
					onLongPress,
					useExpandedMode,
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
		const { destinationRootClientId, shouldReplaceBlock, insertionIndex } =
			this.state;
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
	withDispatch( ( dispatch ) => {
		const { updateSettings } = dispatch( blockEditorStore );
		return { updateSettings };
	} ),
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
		const selectedBlockIndex = getBlockIndex( end );
		const endOfRootIndex = getBlockOrder( rootClientId ).length;
		const isSelectedUnmodifiedDefaultBlock = isAnyBlockSelected
			? isUnmodifiedDefaultBlock( getBlock( end ) )
			: undefined;

		function getDefaultInsertionIndex() {
			const { __experimentalShouldInsertAtTheTop: shouldInsertAtTheTop } =
				getBlockEditorSettings();

			// If post title is selected insert as first block.
			if ( shouldInsertAtTheTop ) {
				return 0;
			}

			// If the clientId is defined, we insert at the position of the block.
			if ( clientId ) {
				return getBlockIndex( clientId );
			}

			// If there is a selected block,
			if ( isAnyBlockSelected ) {
				// And the last selected block is unmodified (empty), it will be replaced.
				if ( isSelectedUnmodifiedDefaultBlock ) {
					return selectedBlockIndex;
				}

				// We insert after the selected block.
				return selectedBlockIndex + 1;
			}

			// Otherwise, we insert at the end of the current rootClientId.
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
			blockTypeImpressions: getBlockEditorSettings().impressions,
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
