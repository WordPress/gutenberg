/**
 * External dependencies
 */
import { FlatList, View, Text, TouchableHighlight } from 'react-native';

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

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );

		this.onClose = this.onClose.bind( this );
		this.onLayout = this.onLayout.bind( this );
		this.state = {
			numberOfColumns: this.calculateNumberOfColumns(),
		};
	}

	componentDidMount() {
		this.props.showInsertionPoint();
	}

	componentWillUnmount() {
		this.props.hideInsertionPoint();
	}

	calculateNumberOfColumns() {
		const bottomSheetWidth = BottomSheet.getWidth();
		const {
			paddingLeft: itemPaddingLeft,
			paddingRight: itemPaddingRight,
		} = styles.modalItem;
		const {
			paddingLeft: containerPaddingLeft,
			paddingRight: containerPaddingRight,
		} = styles.content;
		const { width: itemWidth } = styles.modalIconWrapper;
		const itemTotalWidth = itemWidth + itemPaddingLeft + itemPaddingRight;
		const containerTotalWidth =
			bottomSheetWidth - ( containerPaddingLeft + containerPaddingRight );
		return Math.floor( containerTotalWidth / itemTotalWidth );
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
		const numberOfColumns = this.calculateNumberOfColumns();
		this.setState( { numberOfColumns } );
	}

	render() {
		const { getStylesFromColorScheme } = this.props;
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

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.onClose }
				contentStyle={ [ styles.content, bottomPadding ] }
				hideHeader
			>
				<FlatList
					onLayout={ this.onLayout }
					scrollEnabled={ false }
					key={ `InserterUI-${ this.state.numberOfColumns }` } //re-render when numberOfColumns changes
					keyboardShouldPersistTaps="always"
					numColumns={ this.state.numberOfColumns }
					data={ this.props.items }
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
							onPress={ () => this.props.onSelect( item ) }
						>
							<View style={ styles.modalItem }>
								<View style={ modalIconWrapperStyle }>
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
					if ( count === 1 ) {
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
