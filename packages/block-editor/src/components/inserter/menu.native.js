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
import { withInstanceId, compose, withPreferredColorScheme } from '@wordpress/compose';
import { BottomSheet, Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );

		this.onLayout = this.onLayout.bind( this );
		this.state = {
			numberOfColumns: this.calculateNumberOfColumns(),
		};
	}

	componentDidMount() {
		this.onOpen();
	}

	componentWillUnmount() {
		this.onClose();
	}

	calculateNumberOfColumns() {
		const bottomSheetWidth = BottomSheet.getWidth();
		const { paddingLeft: itemPaddingLeft, paddingRight: itemPaddingRight } = styles.modalItem;
		const { paddingLeft: containerPaddingLeft, paddingRight: containerPaddingRight } = styles.content;
		const { width: itemWidth } = styles.modalIconWrapper;
		const itemTotalWidth = itemWidth + itemPaddingLeft + itemPaddingRight;
		const containerTotalWidth = bottomSheetWidth - ( containerPaddingLeft + containerPaddingRight );
		return Math.floor( containerTotalWidth / itemTotalWidth );
	}

	onOpen() {
		this.props.showInsertionPoint();
	}

	onClose() {
		this.props.hideInsertionPoint();
	}

	onLayout() {
		const numberOfColumns = this.calculateNumberOfColumns();
		this.setState( { numberOfColumns } );
	}

	render() {
		const { getStylesFromColorScheme } = this.props;
		const bottomPadding = styles.contentBottomPadding;
		const modalIconWrapperStyle = getStylesFromColorScheme( styles.modalIconWrapper, styles.modalIconWrapperDark );
		const modalIconStyle = getStylesFromColorScheme( styles.modalIcon, styles.modalIconDark );
		const modalItemLabelStyle = getStylesFromColorScheme( styles.modalItemLabel, styles.modalItemLabelDark );

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.props.onDismiss }
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
					ItemSeparatorComponent={ () =>
						<View style={ styles.rowSeparator } />
					}
					keyExtractor={ ( item ) => item.name }
					renderItem={ ( { item } ) =>
						<TouchableHighlight
							style={ styles.touchableArea }
							underlayColor="transparent"
							activeOpacity={ .5 }
							accessibilityLabel={ item.title }
							onPress={ () => this.props.onSelect( item ) }>
							<View style={ styles.modalItem }>
								<View style={ modalIconWrapperStyle }>
									<View style={ modalIconStyle }>
										<Icon icon={ item.icon.src } fill={ modalIconStyle.fill } size={ modalIconStyle.width } />
									</View>
								</View>
								<Text style={ modalItemLabelStyle }>{ item.title }</Text>
							</View>
						</TouchableHighlight>
					}
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
		} = select( 'core/block-editor' );
		const {
			getChildBlockNames,
		} = select( 'core/blocks' );

		let destinationRootClientId = rootClientId;
		if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
			const end = getBlockSelectionEnd();
			if ( end ) {
				destinationRootClientId = getBlockRootClientId( end ) || undefined;
			}
		}
		const destinationRootBlockName = getBlockName( destinationRootClientId );

		return {
			rootChildBlocks: getChildBlockNames( destinationRootBlockName ),
			items: getInserterItems( destinationRootClientId ),
			destinationRootClientId,
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			showInsertionPoint,
			hideInsertionPoint,
		} = dispatch( 'core/block-editor' );

		return {
			showInsertionPoint() {
				showInsertionPoint(
					ownProps.destinationRootClientId,
					ownProps.insertionIndex,
					ownProps.shouldReplaceBlock
				);
			},
			hideInsertionPoint,
			onSelect( item ) {
				const {
					replaceBlocks,
					insertBlock,
				} = dispatch( 'core/block-editor' );
				const {
					getSelectedBlock,
				} = select( 'core/block-editor' );
				const { name, initialAttributes } = item;
				const selectedBlock = getSelectedBlock();
				const insertedBlock = createBlock( name, initialAttributes );

				if ( ownProps.shouldReplaceBlock ) {
					replaceBlocks( selectedBlock.clientId, insertedBlock );
				} else {
					insertBlock(
						insertedBlock,
						ownProps.insertionIndex,
						ownProps.destinationRootClientId
					);
				}

				ownProps.onSelect();
			},
		};
	} ),
	withInstanceId,
	withPreferredColorScheme,
)( InserterMenu );
