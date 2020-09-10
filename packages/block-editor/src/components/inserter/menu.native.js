/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
import { Component } from '@wordpress/element';
import {
	createBlock,
	rawHandler,
	store as blocksStore,
} from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import {
	BottomSheet,
	BottomSheetConsumer,
	InserterButton,
	getClipboard,
	SegmentedControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;
const TABS = [ __( 'Child Blocks' ), __( 'Reusable blocks' ) ];

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );

		this.onClose = this.onClose.bind( this );
		this.onLayout = this.onLayout.bind( this );
		this.onChangeTab = this.onChangeTab.bind( this );
		this.renderItem = this.renderItem.bind( this );
		this.renderBlocksTab = this.renderBlocksTab.bind( this );
		this.renderReusableBlocksTab = this.renderReusableBlocksTab.bind(
			this
		);
		this.state = {
			numberOfColumns: MIN_COL_NUM,
			tab: 0,
		};

		Dimensions.addEventListener( 'change', this.onLayout );
	}

	componentDidMount() {
		this.props.showInsertionPoint();
	}

	componentWillUnmount() {
		this.props.hideInsertionPoint();
		Dimensions.removeEventListener( 'change', this.onLayout );
	}

	calculateMinItemWidth( bottomSheetWidth ) {
		const { paddingLeft, paddingRight } = styles.columnPadding;
		return (
			( bottomSheetWidth - 2 * ( paddingLeft + paddingRight ) ) /
			MIN_COL_NUM
		);
	}

	calculateItemWidth() {
		const {
			paddingLeft: itemPaddingLeft,
			paddingRight: itemPaddingRight,
		} = InserterButton.Styles.modalItem;
		const { width: itemWidth } = InserterButton.Styles.modalIconWrapper;
		return itemWidth + itemPaddingLeft + itemPaddingRight;
	}

	calculateColumnsProperties() {
		const bottomSheetWidth = BottomSheet.getWidth();
		const { paddingLeft, paddingRight } = styles.columnPadding;
		const itemTotalWidth = this.calculateItemWidth();
		const containerTotalWidth =
			bottomSheetWidth - ( paddingLeft + paddingRight );
		const numofColumns = Math.floor( containerTotalWidth / itemTotalWidth );

		if ( numofColumns < MIN_COL_NUM ) {
			return {
				numOfColumns: MIN_COL_NUM,
				itemWidth: this.calculateMinItemWidth( bottomSheetWidth ),
				maxWidth: containerTotalWidth / MIN_COL_NUM,
			};
		}
		return {
			numOfColumns: numofColumns,
			maxWidth: containerTotalWidth / numofColumns,
		};
	}

	onClose() {
		// if should replace but didn't insert any block
		// re-insert default block
		if ( this.props.shouldReplaceBlock ) {
			this.props.insertDefaultBlock();
		}
		this.props.onDismiss();
	}

	onLayout() {
		const {
			numOfColumns,
			itemWidth,
			maxWidth,
		} = this.calculateColumnsProperties();
		const numberOfColumns = numOfColumns;

		this.setState( { numberOfColumns, itemWidth, maxWidth } );
	}

	onChangeTab( tab ) {
		this.setState( { tab: TABS.indexOf( tab ) } );
	}

	/**
	 * Processes the inserter items to check
	 * if there's any copied block in the clipboard
	 * to add it as an extra item
	 */
	getBlockItems() {
		const {
			items,
			canInsertBlockType,
			destinationRootClientId,
			getBlockType,
		} = this.props;

		// Filter out reusable blocks (they will be added in another tab)
		const blockItems = items.filter(
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
					...blockItems,
			  ]
			: blockItems;
	}

	getReusableBlockItems() {
		const { items } = this.props;

		return items.filter( ( { name } ) => name === 'core/block' );
	}

	renderItem( { item } ) {
		const { itemWidth, maxWidth } = this.state;
		const { onSelect } = this.props;
		return (
			<InserterButton
				item={ item }
				itemWidth={ itemWidth }
				maxWidth={ maxWidth }
				onSelect={ onSelect }
			/>
		);
	}

	renderBlocksTab( listProps ) {
		const { numberOfColumns } = this.state;
		const items = this.getBlockItems();

		return (
			<FlatList
				onLayout={ this.onLayout }
				key={ `InserterUI-Blocks-${ numberOfColumns }` } //re-render when numberOfColumns changes
				keyboardShouldPersistTaps="always"
				numColumns={ numberOfColumns }
				data={ items }
				ItemSeparatorComponent={ () => (
					<TouchableWithoutFeedback accessible={ false }>
						<View style={ styles.rowSeparator } />
					</TouchableWithoutFeedback>
				) }
				keyExtractor={ ( item ) => item.name }
				renderItem={ this.renderItem }
				{ ...listProps }
			/>
		);
	}

	renderReusableBlocksTab( listProps ) {
		const { numberOfColumns } = this.state;
		const items = this.getReusableBlockItems();

		return (
			<FlatList
				onLayout={ this.onLayout }
				key={ `InserterUI-ReusableBlocks-${ numberOfColumns }` } //re-render when numberOfColumns changes
				keyboardShouldPersistTaps="always"
				numColumns={ numberOfColumns }
				data={ items }
				ItemSeparatorComponent={ () => (
					<TouchableWithoutFeedback accessible={ false }>
						<View style={ styles.rowSeparator } />
					</TouchableWithoutFeedback>
				) }
				keyExtractor={ ( item ) => item.name }
				renderItem={ this.renderItem }
				{ ...listProps }
			/>
		);
	}

	render() {
		const { tab } = this.state;
		const reusableBlockItems = this.getReusableBlockItems();

		const hideHeader = reusableBlockItems.length === 0;

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.onClose }
				header={
					<SegmentedControl
						segments={ TABS }
						segmentHandler={ this.onChangeTab }
					/>
				}
				hideHeader={ hideHeader }
				hasNavigation
				contentStyle={ styles.list }
				isChildrenScrollable
			>
				<TouchableHighlight accessible={ false }>
					<BottomSheetConsumer>
						{ ( { listProps } ) => {
							switch ( tab ) {
								case 0:
									return this.renderBlocksTab( listProps );
								case 1:
									return this.renderReusableBlocksTab(
										listProps
									);
							}
						} }
					</BottomSheetConsumer>
				</TouchableHighlight>
			</BottomSheet>
		);
	}
}

export default compose(
	withSelect( ( select, { clientId, isAppender, rootClientId } ) => {
		const {
			getInserterItems,
			getBlockName,
			getBlockRootClientId,
			getBlockSelectionEnd,
			getSettings,
			canInsertBlockType,
		} = select( 'core/block-editor' );
		const { getChildBlockNames, getBlockType } = select( blocksStore );

		let destinationRootClientId = rootClientId;
		if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
			const end = getBlockSelectionEnd();
			if ( end ) {
				destinationRootClientId =
					getBlockRootClientId( end ) || undefined;
			}
		}
		const destinationRootBlockName = getBlockName(
			destinationRootClientId
		);

		const {
			__experimentalShouldInsertAtTheTop: shouldInsertAtTheTop,
		} = getSettings();

		return {
			rootChildBlocks: getChildBlockNames( destinationRootBlockName ),
			items: getInserterItems( destinationRootClientId ),
			destinationRootClientId,
			shouldInsertAtTheTop,
			getBlockType,
			canInsertBlockType,
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			showInsertionPoint,
			hideInsertionPoint,
			removeBlock,
			resetBlocks,
			clearSelectedBlock,
			insertBlock,
			insertDefaultBlock,
		} = dispatch( 'core/block-editor' );

		return {
			showInsertionPoint() {
				if ( ownProps.shouldReplaceBlock ) {
					const { getBlockOrder, getBlockCount } = select(
						'core/block-editor'
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
