/**
 * External dependencies
 */
import { TouchableHighlight } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import {
	BottomSheet,
	BottomSheetConsumer,
	SegmentedControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InserterSearchResults from './search-results';
import InserterSearchForm from './search-form';
import { store as blockEditorStore } from '../../store';
import BlocksTypesTab from './blocks-types-tab';
import ReusableBlocksTab from './reusable-blocks-tab';
import styles from './style.scss';

const MIN_ITEMS_FOR_SEARCH = 2;
const TABS = [ __( 'Blocks' ), __( 'Reusable' ) ];

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

	const {
		items,
		destinationRootClientId,
		getBlockOrder,
		getBlockCount,
		hasReusableBlocks,
	} = useSelect( ( select ) => {
		const {
			getInserterItems,
			getBlockRootClientId,
			getBlockSelectionEnd,
			getSettings,
			...selectBlockEditorStore
		} = select( blockEditorStore );

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
			getBlockOrder: selectBlockEditorStore.getBlockOrder,
			getBlockCount: selectBlockEditorStore.getBlockCount,
			hasReusableBlocks: !! getSettings().__experimentalReusableBlocks
				?.length,
		};
	} );

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

	const onChangeTab = useCallback(
		( selectedTab ) => {
			setTabIndex( TABS.indexOf( selectedTab ) );
		},
		[ setTabIndex ]
	);

	const onSelectItem = useCallback(
		( item ) => {
			onInsert( item );
			onSelect( item );
		},
		[ onInsert, onSelect ]
	);

	const getCurrentTab = useCallback(
		( listProps ) => {
			const tabProps = {
				rootClientId,
				onSelect: onSelectItem,
				listProps,
			};

			switch ( tabIndex ) {
				case 0:
					return <BlocksTypesTab { ...tabProps } />;
				case 1:
					return <ReusableBlocksTab { ...tabProps } />;
			}
		},
		[ tabIndex, rootClientId, onSelectItem ]
	);

	return (
		<BottomSheet
			isVisible={ true }
			onClose={ onClose }
			header={
				<>
					{ showSearchForm && (
						<InserterSearchForm
							onChange={ ( value ) => {
								setFilterValue( value );
							} }
							value={ filterValue }
						/>
					) }
					{ ! filterValue && hasReusableBlocks && (
						<SegmentedControl
							segments={ TABS }
							segmentHandler={ onChangeTab }
						/>
					) }
				</>
			}
			hasNavigation
			contentStyle={ styles.list }
		>
			<BottomSheetConsumer>
				{ ( { listProps } ) => (
					<TouchableHighlight accessible={ false }>
						{ filterValue ? (
							<InserterSearchResults
								filterValue={ filterValue }
								onSelect={ onSelectItem }
								listProps={ listProps }
							/>
						) : (
							getCurrentTab( listProps )
						) }
					</TouchableHighlight>
				) }
			</BottomSheetConsumer>
		</BottomSheet>
	);
}

export default InserterMenu;
