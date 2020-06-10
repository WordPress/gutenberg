/**
 * External dependencies
 */
import { Platform, findNodeHandle } from 'react-native';
import { partial, first, castArray, last, compact } from 'lodash';
/**
 * WordPress dependencies
 */
import { ToolbarButton, Picker } from '@wordpress/components';
import {
	getBlockType,
	getDefaultBlockName,
	serialize,
} from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import { moreHorizontalMobile } from '@wordpress/icons';
import { useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { getMoversSetup } from '../block-mover/mover-description';

const BlockActionsMenu = ( {
	onDelete,
	isStackedHorizontally,
	wrapBlockSettings,
	wrapBlockMover,
	openGeneralSidebar,
	onMoveDown,
	onMoveUp,
	isFirst,
	isLast,
	blockTitle,
	isEmptyDefaultBlock,
	anchorNodeRef,
	getBlocksByClientId,
	selectedBlockClientId,
	updateClipboard,
	duplicateBlock,
	removeBlocks,
} ) => {
	const pickerRef = useRef();
	const moversOptions = { keys: [ 'icon', 'actionTitle' ], blockTitle };

	const {
		actionTitle: {
			backward: backwardButtonTitle,
			forward: forwardButtonTitle,
		},
	} = getMoversSetup( isStackedHorizontally, moversOptions );

	const deleteOption = {
		id: 'deleteOption',
		// translators: %s: block title e.g: "Paragraph".
		label: sprintf( __( 'Remove %s' ), blockTitle ),
		value: 'deleteOption',
		separated: true,
		disabled: isEmptyDefaultBlock,
	};

	const settingsOption = {
		id: 'settingsOption',
		// translators: %s: block title e.g: "Paragraph".
		label: sprintf( __( '%s Settings' ), blockTitle ),
		value: 'settingsOption',
	};

	const backwardButtonOption = {
		id: 'backwardButtonOption',
		label: backwardButtonTitle,
		value: 'backwardButtonOption',
		disabled: isFirst,
	};

	const forwardButtonOption = {
		id: 'forwardButtonOption',
		label: forwardButtonTitle,
		value: 'forwardButtonOption',
		disabled: isLast,
	};

	const copyButtonOption = {
		id: 'copyButtonOption',
		label: __( 'Copy' ),
		value: 'copyButtonOption',
	};

	const cutButtonOption = {
		id: 'cutButtonOption',
		label: __( 'Cut' ),
		value: 'cutButtonOption',
	};

	const duplicateButtonOption = {
		id: 'duplicateButtonOption',
		label: __( 'Duplicate' ),
		value: 'duplicateButtonOption',
	};

	const options = compact( [
		wrapBlockMover && backwardButtonOption,
		wrapBlockMover && forwardButtonOption,
		wrapBlockSettings && settingsOption,
		copyButtonOption,
		cutButtonOption,
		duplicateButtonOption,
		deleteOption,
	] );

	async function onPickerSelect( value ) {
		switch ( value ) {
			case deleteOption.value:
				onDelete();
				break;
			case settingsOption.value:
				openGeneralSidebar();
				break;
			case forwardButtonOption.value:
				onMoveDown();
				break;
			case backwardButtonOption.value:
				onMoveUp();
				break;
			case copyButtonOption.value:
				const copyBlock = getBlocksByClientId( selectedBlockClientId );
				updateClipboard( serialize( copyBlock ) );
				break;
			case cutButtonOption.value:
				const cutBlock = getBlocksByClientId( selectedBlockClientId );
				updateClipboard( serialize( cutBlock ) );
				removeBlocks( selectedBlockClientId );
				break;
			case duplicateButtonOption.value:
				duplicateBlock();
				break;
		}
	}

	function onPickerPresent() {
		if ( pickerRef.current ) {
			pickerRef.current.presentPicker();
		}
	}

	const disabledButtonIndices = options
		.map( ( option, index ) => option.disabled && index + 1 )
		.filter( Boolean );

	const accessibilityHint =
		Platform.OS === 'ios'
			? __( 'Double tap to open Action Sheet with available options' )
			: __( 'Double tap to open Bottom Sheet with available options' );

	return (
		<>
			<ToolbarButton
				title={ __( 'Open Block Actions Menu' ) }
				onClick={ onPickerPresent }
				icon={ moreHorizontalMobile }
				extraProps={ {
					hint: accessibilityHint,
				} }
			/>
			<Picker
				ref={ pickerRef }
				options={ options }
				onChange={ onPickerSelect }
				destructiveButtonIndex={ options.length }
				disabledButtonIndices={ disabledButtonIndices }
				hideCancelButton={ Platform.OS !== 'ios' }
				leftAlign={ true }
				anchor={
					anchorNodeRef ? findNodeHandle( anchorNodeRef ) : undefined
				}
			/>
		</>
	);
};

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlockIndex,
			getBlockRootClientId,
			getBlockOrder,
			getBlockName,
			getBlock,
			getBlocksByClientId,
			getSelectedBlockClientIds,
		} = select( 'core/block-editor' );
		const normalizedClientIds = castArray( clientIds );
		const block = getBlock( normalizedClientIds );
		const blockName = getBlockName( normalizedClientIds );
		const blockType = getBlockType( blockName );
		const blockTitle = blockType.title;
		const firstClientId = first( normalizedClientIds );
		const rootClientId = getBlockRootClientId( firstClientId );
		const blockOrder = getBlockOrder( rootClientId );

		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex(
			last( normalizedClientIds ),
			rootClientId
		);

		const isDefaultBlock = blockName === getDefaultBlockName();
		const isEmptyContent = block.attributes.content === '';
		const isExactlyOneBlock = blockOrder.length === 1;
		const isEmptyDefaultBlock =
			isExactlyOneBlock && isDefaultBlock && isEmptyContent;

		return {
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
			rootClientId,
			blockTitle,
			isEmptyDefaultBlock,
			getBlocksByClientId,
			selectedBlockClientId: getSelectedBlockClientIds(),
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const {
			moveBlocksDown,
			moveBlocksUp,
			duplicateBlocks,
			removeBlocks,
		} = dispatch( 'core/block-editor' );
		const { openGeneralSidebar } = dispatch( 'core/edit-post' );
		const { updateClipboard } = dispatch( 'core/editor' );

		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
			openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
			updateClipboard,
			duplicateBlock() {
				return duplicateBlocks( clientIds );
			},
			removeBlocks,
		};
	} ),
	withInstanceId
)( BlockActionsMenu );
