/**
 * External dependencies
 */
import {
	FlatList,
	View,
	Text,
	TouchableHighlight,
	Dimensions,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	withInstanceId,
	compose,
	withPreferredColorScheme,
} from '@wordpress/compose';
import { BottomSheet, Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );

		this.onClose = this.onClose.bind( this );
		this.onLayout = this.onLayout.bind( this );
		this.state = {
			numberOfColumns: MIN_COL_NUM,
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
		} = styles.modalItem;
		const { width: itemWidth } = styles.modalIconWrapper;
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
		const columnProperties = this.calculateColumnsProperties();
		const numberOfColumns = columnProperties.numOfColumns;

		this.setState( { numberOfColumns } );
	}

	render() {
		const { getStylesFromColorScheme, items, onSelect } = this.props;
		const { numberOfColumns } = this.state;

		const bottomPadding = styles.contentBottomPadding;
		const modalIconWrapperStyle = getStylesFromColorScheme(
			styles.modalIconWrapper,
			styles.modalIconWrapperDark
		);
		const modalIconStyle = getStylesFromColorScheme(
			styles.modalIcon,
			styles.modalIconDark
		);
		const modalItemLabelStyle = getStylesFromColorScheme(
			styles.modalItemLabel,
			styles.modalItemLabelDark
		);

		const columnProperties = this.calculateColumnsProperties();

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.onClose }
				contentStyle={ [ styles.content, bottomPadding ] }
				hideHeader
			>
				<TouchableHighlight accessible={ false }>
					<FlatList
						onLayout={ this.onLayout }
						scrollEnabled={ false }
						key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
						keyboardShouldPersistTaps="always"
						numColumns={ numberOfColumns }
						data={ items }
						ItemSeparatorComponent={ () => (
							<View style={ styles.rowSeparator } />
						) }
						keyExtractor={ ( item ) => item.name }
						renderItem={ ( { item } ) => (
							<TouchableHighlight
								style={ styles.touchableArea }
								underlayColor="transparent"
								activeOpacity={ 0.5 }
								accessibilityLabel={ item.title }
								onPress={ () => onSelect( item ) }
							>
								<View
									style={ [
										styles.modalItem,
										{ width: columnProperties.maxWidth },
									] }
								>
									<View
										style={ [
											modalIconWrapperStyle,
											columnProperties.itemWidth && {
												width:
													columnProperties.itemWidth,
											},
										] }
									>
										<View style={ modalIconStyle }>
											<Icon
												icon={ item.icon.src }
												fill={ modalIconStyle.fill }
												size={ modalIconStyle.width }
											/>
										</View>
									</View>
									<Text style={ modalItemLabelStyle }>
										{ item.title }
									</Text>
								</View>
							</TouchableHighlight>
						) }
					/>
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
		} = select( 'core/block-editor' );
		const { getChildBlockNames } = select( 'core/blocks' );

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
				const { name, initialAttributes } = item;

				const insertedBlock = createBlock( name, initialAttributes );

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
	withInstanceId,
	withPreferredColorScheme
)( InserterMenu );
