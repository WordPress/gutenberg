/**
 * External dependencies
 */
import { FlatList, View, Text, TouchableHighlight } from 'react-native';
import { subscribeMediaAppend } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	createBlock,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import { BottomSheet, Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export class InserterMenu extends Component {
	componentDidMount() {
		this.subscriptionParentMediaAppend = subscribeMediaAppend( ( payload ) => {
			this.props.onSelect( {
				name: 'core/' + payload.mediaType,
				initialAttributes: {
					id: payload.mediaId,
					[ payload.mediaType === 'image' ? 'url' : 'src' ]: payload.mediaUrl,
				},
			} );
		} );
		this.onOpen();
	}

	componentWillUnmount() {
		if ( this.subscriptionParentMediaAppend ) {
			this.subscriptionParentMediaAppend.remove();
		}
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

	render() {
		const numberOfColumns = this.calculateNumberOfColumns();
		const bottomPadding = styles.contentBottomPadding;

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.props.onDismiss }
				contentStyle={ [ styles.content, bottomPadding ] }
				hideHeader
			>
				<FlatList
					scrollEnabled={ false }
					key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
					keyboardShouldPersistTaps="always"
					numColumns={ numberOfColumns }
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
								<View style={ styles.modalIconWrapper }>
									<View style={ styles.modalIcon }>
										<Icon icon={ item.icon.src } fill={ styles.modalIcon.fill } size={ styles.modalIcon.width } />
									</View>
								</View>
								<Text style={ styles.modalItemLabel }>{ item.title }</Text>
							</View>
						</TouchableHighlight>
					}
				/>
			</BottomSheet>
		);
		/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/no-noninteractive-element-interactions */
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
			if ( ! isAppender && end ) {
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
)( InserterMenu );
