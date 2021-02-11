/**
 * External dependencies
 */
import {
	FlatList,
	View,
	TouchableHighlight,
	TouchableWithoutFeedback,
	Dimensions,
} from 'react-native';
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import {
	createBlock,
	rawHandler,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { withInstanceId } from '@wordpress/compose';
import {
	BottomSheet,
	BottomSheetConsumer,
	InserterButton,
	getClipboard,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { store as blockEditorStore } from '../../store';
//import useInsertionPoint from './hooks/use-insertion-point';

const MIN_COL_NUM = 3;

function InserterMenu( {
	insertionIndex,
	onDismiss,
	onSelect,
	isAppender,
	clientId,
	rootClientId,
	shouldReplaceBlock,
} ) {
	const [ numberOfColumns, setNumberOfColumns ] = useState( MIN_COL_NUM );
	const [ itemWidth, setItemWidth ] = useState();
	const [ maxWidth, setMaxWidth ] = useState();

	const {
		hideInsertionPoint,
		insertDefaultBlock,
		insertBlock,
		clearSelectedBlock,
		removeBlock,
		showInsertionPoint,
		resetBlocks,
	} = useDispatch( blockEditorStore );

	const {
		items,
		destinationRootClientId,
		canInsertBlockType,
		getBlockOrder,
		getBlockCount,
	} = useSelect( ( select ) => {
		const selectBlockEditorStore = select( blockEditorStore );

		const {
			getInserterItems,
			getBlockRootClientId,
			getBlockSelectionEnd,
		} = selectBlockEditorStore;

		let targetRootClientId = rootClientId;
		if ( ! targetRootClientId && ! clientId && ! isAppender ) {
			const end = getBlockSelectionEnd();
			if ( end ) {
				targetRootClientId = getBlockRootClientId( end ) || undefined;
			}
		}

		return {
			items: getInserterItems( targetRootClientId ),
			destinationRootClientId: targetRootClientId,
			canInsertBlockType: selectBlockEditorStore.canInsertBlockType,
			getBlockOrder: selectBlockEditorStore.getBlockOrder,
			getBlockCount: selectBlockEditorStore.getBlockCount,
		};
	} );

	const { getBlockType } = useSelect( ( select ) => select( blocksStore ) );

	useEffect( () => {
		if ( shouldReplaceBlock ) {
			const count = getBlockCount();
			// Check if there is a rootClientId because that means it is a nested replaceable block
			// and we don't want to clear/reset all blocks.
			if ( count === 1 && ! rootClientId ) {
				// Removing the last block is not possilble with `removeBlock` action.
				// It always inserts a default block if the last of the blocks have been removed.
				clearSelectedBlock();
				resetBlocks( [] );
			} else {
				const blockToReplace = getBlockOrder( destinationRootClientId )[
					insertionIndex
				];
				removeBlock( blockToReplace, false );
			}
		}

		showInsertionPoint( destinationRootClientId, insertionIndex );

		Dimensions.addEventListener( 'change', onLayout );

		return () => {
			hideInsertionPoint();
			Dimensions.removeEventListener( 'change', onLayout );
		};
	}, [] );

	function calculateItemWidth() {
		const {
			paddingLeft: itemPaddingLeft,
			paddingRight: itemPaddingRight,
		} = InserterButton.Styles.modalItem;
		const { width } = InserterButton.Styles.modalIconWrapper;
		return width + itemPaddingLeft + itemPaddingRight;
	}

	function onClose() {
		// if should replace but didn't insert any block
		// re-insert default block
		if ( shouldReplaceBlock ) {
			insertDefaultBlock( {}, destinationRootClientId, insertionIndex );
		}
		onDismiss();
	}

	function onLayout() {
		const sumLeftRightPadding =
			styles.columnPadding.paddingLeft +
			styles.columnPadding.paddingRight;

		const bottomSheetWidth = BottomSheet.getWidth();
		const containerTotalWidth = bottomSheetWidth - sumLeftRightPadding;
		const itemTotalWidth = calculateItemWidth();

		const columnsFitToWidth = Math.floor(
			containerTotalWidth / itemTotalWidth
		);

		const numColumns = Math.max( MIN_COL_NUM, columnsFitToWidth );

		setNumberOfColumns( numColumns );
		setMaxWidth( containerTotalWidth / numColumns );

		if ( columnsFitToWidth < MIN_COL_NUM ) {
			const updatedItemWidth =
				( bottomSheetWidth - 2 * sumLeftRightPadding ) / MIN_COL_NUM;
			setItemWidth( updatedItemWidth );
		}
	}

	/**
	 * Processes the inserter items to check
	 * if there's any copied block in the clipboard
	 * to add it as an extra item
	 */
	function getItems() {
		// Filter out reusable blocks (they will be added in another tab)
		const itemsToDisplay = items.filter(
			( { name } ) => name !== 'core/block'
		);

		const clipboard = getClipboard();
		const clipboardBlock =
			clipboard && rawHandler( { HTML: clipboard } )[ 0 ];
		const shouldAddClipboardBlock =
			clipboardBlock &&
			canInsertBlockType( clipboardBlock.name, destinationRootClientId );

		return shouldAddClipboardBlock
			? [
					{
						...pick( getBlockType( clipboardBlock.name ), [
							'name',
							'icon',
						] ),
						id: 'clipboard',
						initialAttributes: clipboardBlock.attributes,
						innerBlocks: clipboardBlock.innerBlocks,
					},
					...itemsToDisplay,
			  ]
			: itemsToDisplay;
	}

	function onBlockSelect( item ) {
		const { name, initialAttributes, innerBlocks } = item;

		const insertedBlock = createBlock(
			name,
			initialAttributes,
			innerBlocks
		);

		insertBlock( insertedBlock, insertionIndex, destinationRootClientId );

		onSelect();
	}

	return (
		<BottomSheet
			isVisible={ true }
			onClose={ onClose }
			hideHeader
			hasNavigation
		>
			<TouchableHighlight accessible={ false }>
				<BottomSheetConsumer>
					{ ( { listProps, safeAreaBottomInset } ) => (
						<FlatList
							onLayout={ onLayout }
							key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
							keyboardShouldPersistTaps="always"
							numColumns={ numberOfColumns }
							data={ getItems() }
							ItemSeparatorComponent={ () => (
								<TouchableWithoutFeedback accessible={ false }>
									<View style={ styles.rowSeparator } />
								</TouchableWithoutFeedback>
							) }
							keyExtractor={ ( item ) => item.name }
							renderItem={ ( { item } ) => (
								<InserterButton
									{ ...{
										item,
										itemWidth,
										maxWidth,
									} }
									onSelect={ onBlockSelect }
								/>
							) }
							{ ...listProps }
							contentContainerStyle={ [
								...listProps.contentContainerStyle,
								{
									paddingBottom:
										safeAreaBottomInset ||
										styles.list.paddingBottom,
								},
							] }
						/>
					) }
				</BottomSheetConsumer>
			</TouchableHighlight>
		</BottomSheet>
	);
}

export default withInstanceId( InserterMenu );
