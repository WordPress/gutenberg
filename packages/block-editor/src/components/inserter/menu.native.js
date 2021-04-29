/**
 * External dependencies
 */
import { LayoutAnimation, Platform, TouchableHighlight } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { BottomSheet, BottomSheetConsumer } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InserterSearchResults from './search-results';
import InserterSearchForm from './search-form';
import { store as blockEditorStore } from '../../store';
import InserterTabs from './tabs';
import styles from './style.scss';

const MIN_ITEMS_FOR_SEARCH = 2;

function InserterMenu( {
	onSelect,
	onDismiss,
	rootClientId,
	clientId,
	isAppender,
	shouldReplaceBlock,
	insertionIndex,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ searchFocus, setSearchFocus ] = useState( false );
	// eslint-disable-next-line no-undef
	const [ showSearchForm, setShowSearchForm ] = useState( __DEV__ );
	const [ tabIndex, setTabIndex ] = useState( 0 );

	const {
		showInsertionPoint,
		hideInsertionPoint,
		clearSelectedBlock,
		insertBlock,
		removeBlock,
		resetBlocks,
		insertDefaultBlock,
	} = useDispatch( blockEditorStore );

	const { items, destinationRootClientId, hasReusableBlocks } = useSelect(
		( select ) => {
			const {
				getInserterItems,
				getBlockRootClientId,
				getBlockSelectionEnd,
				getSettings,
			} = select( blockEditorStore );

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
				hasReusableBlocks: !! getSettings().__experimentalReusableBlocks
					?.length,
			};
		}
	);

	const { getBlockOrder, getBlockCount } = useSelect( blockEditorStore );

	useEffect( () => {
		// Show/Hide insertion point on Mount/Dismount
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

		// Show search form if there are enough items to filter.
		if ( items.length < MIN_ITEMS_FOR_SEARCH ) {
			setShowSearchForm( false );
		}

		return hideInsertionPoint;
	}, [] );

	const onClose = useCallback( () => {
		// if should replace but didn't insert any block
		// re-insert default block
		if ( shouldReplaceBlock ) {
			insertDefaultBlock( {}, destinationRootClientId, insertionIndex );
		}
		onDismiss();
	}, [ shouldReplaceBlock, destinationRootClientId, insertionIndex ] );

	const onInsert = useCallback(
		( item ) => {
			const { name, initialAttributes, innerBlocks } = item;

			const newBlock = createBlock(
				name,
				initialAttributes,
				innerBlocks
			);

			insertBlock(
				newBlock,
				insertionIndex,
				destinationRootClientId,
				true,
				{ source: 'inserter_menu' }
			);
		},
		[ insertBlock, destinationRootClientId, insertionIndex ]
	);

	const onSelectItem = useCallback(
		( item ) => {
			onInsert( item );
			onSelect( item );
		},
		[ onInsert, onSelect ]
	);

	const onChangeSearch = useCallback(
		( value ) => {
			if ( Platform.OS === 'ios' && ! value ) {
				LayoutAnimation.configureNext(
					LayoutAnimation.Presets.easeInEaseOut
				);
			}
			setFilterValue( value );
		},
		[ setFilterValue ]
	);

	const onFocusSearch = useCallback(
		( focus ) => {
			if ( Platform.OS === 'ios' ) {
				LayoutAnimation.configureNext(
					LayoutAnimation.Presets.easeInEaseOut
				);
			}
			setSearchFocus( focus );
		},
		[ setSearchFocus ]
	);

	const showReusableBlocks = ! rootClientId;

	return (
		<BottomSheet
			isVisible={ true }
			onClose={ onClose }
			header={
				<>
					{ showSearchForm && (
						<InserterSearchForm
							onChange={ onChangeSearch }
							onFocus={ onFocusSearch }
							value={ filterValue }
						/>
					) }
					{ ! searchFocus && ! filterValue && hasReusableBlocks && (
						<InserterTabs.Control
							onChangeTab={ setTabIndex }
							showReusableBlocks={ showReusableBlocks }
						/>
					) }
				</>
			}
			hasNavigation
			setMinHeightToMaxHeight={ showSearchForm }
			contentStyle={ styles.list }
		>
			<BottomSheetConsumer>
				{ ( { listProps } ) => (
					<TouchableHighlight accessible={ false }>
						{ searchFocus || filterValue ? (
							<InserterSearchResults
								rootClientId={ rootClientId }
								filterValue={ filterValue }
								onSelect={ onSelectItem }
								listProps={ listProps }
							/>
						) : (
							<InserterTabs
								rootClientId={ rootClientId }
								listProps={ listProps }
								tabIndex={ tabIndex }
								onSelect={ onSelectItem }
								showReusableBlocks={ showReusableBlocks }
							/>
						) }
					</TouchableHighlight>
				) }
			</BottomSheetConsumer>
		</BottomSheet>
	);
}

export default InserterMenu;
