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
import { withDispatch, withSelect, useSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
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

const MIN_COL_NUM = 3;

function InserterMenu( {
	showInsertionPoint,
	hideInsertionPoint,
	insertDefaultBlock,
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

	const { items, destinationRootClientId, canInsertBlockType } = useSelect(
		( select ) => {
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
					targetRootClientId =
						getBlockRootClientId( end ) || undefined;
				}
			}

			return {
				items: getInserterItems( targetRootClientId ),
				destinationRootClientId: targetRootClientId,
				canInsertBlockType: selectBlockEditorStore.canInsertBlockType,
			};
		}
	);

	const { getBlockType } = useSelect( ( select ) => select( blocksStore ) );

	useEffect( () => {
		showInsertionPoint();
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
			insertDefaultBlock();
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
										onSelect,
									} }
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

export default compose(
	withSelect( () => ( {} ) ),

	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			showInsertionPoint,
			hideInsertionPoint,
			removeBlock,
			resetBlocks,
			clearSelectedBlock,
			insertBlock,
			insertDefaultBlock,
		} = dispatch( blockEditorStore );

		return {
			showInsertionPoint() {
				if ( ownProps.shouldReplaceBlock ) {
					const { getBlockOrder, getBlockCount } = select(
						blockEditorStore
					);

					const count = getBlockCount();
					// Check if there is a rootClientId because that means it is a nested replacable block and we don't want to clear/reset all blocks.
					if ( count === 1 && ! ownProps.rootClientId ) {
						// removing the last block is not possible with `removeBlock` action
						// it always inserts a default block if the last of the blocks have been removed
						clearSelectedBlock();
						resetBlocks( [] );
					} else {
						const blockToReplace = getBlockOrder(
							ownProps.destinationRootClientId
						)[ ownProps.insertionIndex ];

						removeBlock( blockToReplace, false );
					}
				}
				showInsertionPoint(
					ownProps.destinationRootClientId,
					ownProps.insertionIndex
				);
			},
			hideInsertionPoint,
			onSelect( item ) {
				const { name, initialAttributes, innerBlocks } = item;

				const insertedBlock = createBlock(
					name,
					initialAttributes,
					innerBlocks
				);

				insertBlock(
					insertedBlock,
					ownProps.insertionIndex,
					ownProps.destinationRootClientId
				);

				ownProps.onSelect();
			},
			insertDefaultBlock() {
				insertDefaultBlock(
					{},
					ownProps.destinationRootClientId,
					ownProps.insertionIndex
				);
			},
		};
	} ),
	withInstanceId
)( InserterMenu );
