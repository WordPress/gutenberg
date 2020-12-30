/**
 * External dependencies
 */
import { Platform, findNodeHandle } from 'react-native';
import { partial, first, castArray, last, compact } from 'lodash';
/**
 * WordPress dependencies
 */
import {
	getClipboard,
	setClipboard,
	ToolbarButton,
	Picker,
} from '@wordpress/components';
import {
	getBlockType,
	getDefaultBlockName,
	serialize,
	rawHandler,
	createBlock,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import { moreHorizontalMobile } from '@wordpress/icons';
import { useRef, useState } from '@wordpress/element';
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
	createSuccessNotice,
	duplicateBlock,
	removeBlocks,
	pasteBlock,
	canInsertBlockType,
	rootClientId,
} ) => {
	const [ clipboard, setCurrentClipboard ] = useState( getClipboard() );
	const pickerRef = useRef();
	const moversOptions = { keys: [ 'icon', 'actionTitle' ] };
	const clipboardBlock = clipboard && rawHandler( { HTML: clipboard } )[ 0 ];
	const isPasteEnabled =
		clipboardBlock &&
		canInsertBlockType( clipboardBlock.name, rootClientId );

	const {
		actionTitle: {
			backward: backwardButtonTitle,
			forward: forwardButtonTitle,
		},
	} = getMoversSetup( isStackedHorizontally, moversOptions );

	const deleteOption = {
		id: 'deleteOption',
		label: __( 'Remove block' ),
		value: 'deleteOption',
		separated: true,
		disabled: isEmptyDefaultBlock,
	};

	const settingsOption = {
		id: 'settingsOption',
		label: __( 'Block settings' ),
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
		label: __( 'Copy block' ),
		value: 'copyButtonOption',
	};

	const cutButtonOption = {
		id: 'cutButtonOption',
		label: __( 'Cut block' ),
		value: 'cutButtonOption',
	};

	const pasteButtonOption = {
		id: 'pasteButtonOption',
		label: __( 'Paste block after' ),
		value: 'pasteButtonOption',
	};

	const duplicateButtonOption = {
		id: 'duplicateButtonOption',
		label: __( 'Duplicate block' ),
		value: 'duplicateButtonOption',
	};

	const options = compact( [
		wrapBlockMover && backwardButtonOption,
		wrapBlockMover && forwardButtonOption,
		wrapBlockSettings && settingsOption,
		copyButtonOption,
		cutButtonOption,
		isPasteEnabled && pasteButtonOption,
		duplicateButtonOption,
		deleteOption,
	] );

	function onPasteBlock() {
		if ( ! clipboard ) {
			return;
		}

		pasteBlock( rawHandler( { HTML: clipboard } )[ 0 ] );
	}

	function onPickerSelect( value ) {
		switch ( value ) {
			case deleteOption.value:
				onDelete();
				createSuccessNotice(
					// translators: displayed right after the block is removed.
					__( 'Block removed' )
				);
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
				const serializedBlock = serialize( copyBlock );
				setCurrentClipboard( serializedBlock );
				setClipboard( serializedBlock );
				createSuccessNotice(
					// translators: displayed right after the block is copied.
					__( 'Block copied' )
				);
				break;
			case cutButtonOption.value:
				const cutBlock = getBlocksByClientId( selectedBlockClientId );
				setClipboard( serialize( cutBlock ) );
				removeBlocks( selectedBlockClientId );
				createSuccessNotice(
					// translators: displayed right after the block is cut.
					__( 'Block cut' )
				);
				break;
			case pasteButtonOption.value:
				onPasteBlock();
				createSuccessNotice(
					// translators: displayed right after the block is pasted.
					__( 'Block pasted' )
				);
				break;
			case duplicateButtonOption.value:
				duplicateBlock();
				createSuccessNotice(
					// translators: displayed right after the block is duplicated.
					__( 'Block duplicated' )
				);
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

	const getAnchor = () =>
		anchorNodeRef ? findNodeHandle( anchorNodeRef ) : undefined;

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
				getAnchor={ getAnchor }
				// translators: %s: block title e.g: "Paragraph".
				title={ sprintf( __( '%s block options' ), blockTitle ) }
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
			canInsertBlockType,
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
			currentIndex: firstIndex,
			canInsertBlockType,
		};
	} ),
	withDispatch(
		( dispatch, { clientIds, rootClientId, currentIndex }, { select } ) => {
			const {
				moveBlocksDown,
				moveBlocksUp,
				duplicateBlocks,
				removeBlocks,
				insertBlock,
				replaceBlocks,
			} = dispatch( 'core/block-editor' );
			const { openGeneralSidebar } = dispatch( 'core/edit-post' );
			const { getBlockSelectionEnd, getBlock } = select(
				'core/block-editor'
			);
			const { createSuccessNotice } = dispatch( 'core/notices' );

			return {
				onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
				onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
				openGeneralSidebar: () =>
					openGeneralSidebar( 'edit-post/block' ),
				createSuccessNotice,
				duplicateBlock() {
					return duplicateBlocks( clientIds );
				},
				removeBlocks,
				pasteBlock: ( clipboardBlock ) => {
					const canReplaceBlock = isUnmodifiedDefaultBlock(
						getBlock( getBlockSelectionEnd() )
					);

					if ( ! canReplaceBlock ) {
						const insertedBlock = createBlock(
							clipboardBlock.name,
							clipboardBlock.attributes,
							clipboardBlock.innerBlocks
						);

						insertBlock(
							insertedBlock,
							currentIndex + 1,
							rootClientId
						);
					} else {
						replaceBlocks( clientIds, clipboardBlock );
					}
				},
			};
		}
	),
	withInstanceId
)( BlockActionsMenu );
