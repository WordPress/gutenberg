/**
 * External dependencies
 */
import { FlatList, View, Text, TouchableHighlight } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	createBlock,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
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

		// To avoid duplication, getInsertionIndex is extracted and used in two event handlers
		// This breaks the withDispatch not containing any logic rule.
		// Since it's a function only called when the event handlers are called,
		// it's fine to extract it.
		// eslint-disable-next-line no-restricted-syntax
		function getInsertionIndex() {
			const {
				getBlock,
				getBlockIndex,
				getBlockSelectionEnd,
				getBlockOrder,
			} = select( 'core/block-editor' );
			const {
				isPostTitleSelected,
			} = select( 'core/editor' );
			const { clientId, destinationRootClientId, isAppender } = ownProps;

			// if post title is selected insert as first block
			if ( isPostTitleSelected() ) {
				return 0;
			}

			// If the clientId is defined, we insert at the position of the block.
			if ( clientId ) {
				return getBlockIndex( clientId, destinationRootClientId );
			}

			// If there a selected block,
			const end = getBlockSelectionEnd();
			// `end` argument (id) can refer to the component which is removed
			// due to pressing `undo` button, that's why we need to check
			// if `getBlock( end) is valid, otherwise `null` is passed
			if ( ! isAppender && end && getBlock( end ) ) {
				// and the last selected block is unmodified (empty), it will be replaced
				if ( isUnmodifiedDefaultBlock( getBlock( end ) ) ) {
					return getBlockIndex( end, destinationRootClientId );
				}

				// we insert after the selected block.
				return getBlockIndex( end, destinationRootClientId ) + 1;
			}

			// Otherwise, we insert at the end of the current rootClientId
			return getBlockOrder( destinationRootClientId ).length;
		}

		return {
			showInsertionPoint() {
				const index = getInsertionIndex();
				showInsertionPoint( ownProps.destinationRootClientId, index );
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
				const { isAppender } = ownProps;
				const { name, initialAttributes } = item;
				const selectedBlock = getSelectedBlock();
				const insertedBlock = createBlock( name, initialAttributes );
				if ( ! isAppender && selectedBlock && isUnmodifiedDefaultBlock( selectedBlock ) ) {
					replaceBlocks( selectedBlock.clientId, insertedBlock );
				} else {
					insertBlock(
						insertedBlock,
						getInsertionIndex(),
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
