/**
 * External dependencies
 */
import { View, findNodeHandle, Dimensions, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	ReadableContentView,
	WIDE_ALIGNMENTS,
	ALIGNMENT_BREAKPOINTS,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockInsertionPoint from './insertion-point';
import styles from './block-list-item.native.scss';

const stretchStyle = {
	flex: 1,
};

export class BlockListItem extends Component {
	constructor() {
		super( ...arguments );

		this.onLayout = this.onLayout.bind( this );
		this.blockRef = createRef();
		this.scrollToBlockIfItsNotVisible = this.scrollToBlockIfItsNotVisible.bind(
			this
		);

		this.state = {
			blockWidth: 0,
		};
	}

	onLayout( { nativeEvent } ) {
		const { layout } = nativeEvent;
		const { blockWidth } = this.state;

		if ( blockWidth !== layout.width ) {
			this.setState( { blockWidth: layout.width } );
		}
	}

	getMarginHorizontal() {
		const {
			blockAlignment,
			marginHorizontal,
			parentBlockAlignment,
		} = this.props;
		const { blockWidth } = this.state;

		if ( blockAlignment === WIDE_ALIGNMENTS.alignments.full ) {
			return 0;
		}

		if ( blockAlignment === WIDE_ALIGNMENTS.alignments.wide ) {
			return marginHorizontal;
		}

		if (
			parentBlockAlignment === WIDE_ALIGNMENTS.alignments.full &&
			blockWidth <= ALIGNMENT_BREAKPOINTS.medium
		) {
			return marginHorizontal * 2;
		}

		return marginHorizontal;
	}

	getContentStyles( readableContentViewStyle ) {
		const { blockAlignment, hasParents } = this.props;
		const isFullWidth = blockAlignment === WIDE_ALIGNMENTS.alignments.full;

		return [
			readableContentViewStyle,
			isFullWidth &&
				! hasParents && {
					width: styles.fullAlignment.width,
				},
			isFullWidth &&
				hasParents && {
					paddingHorizontal: styles.fullAlignmentPadding.paddingLeft,
				},
		];
	}

	componentDidUpdate() {
		this.scrollToBlockIfItsNotVisible();
	}

	scrollToBlockIfItsNotVisible() {
		const { isSelected } = this.props;
		const isIOS = Platform.OS === 'ios';
		const scrollAdjustmentY = isIOS ? 200 : 100;

		if ( isSelected ) {
			if ( this.blockRef.current ) {
				this.blockRef.current.measureLayout(
					findNodeHandle( this.props.listRef.current ),
					( x, y ) => {
						this.blockRef.current.measure(
							( _x, _y, blockWidth, blockHeight, px, py ) => {
								const window = Dimensions.get( 'window' );

								const { scrollToBlockListOffset } = this.props;

								if ( py - scrollAdjustmentY < 0 ) {
									scrollToBlockListOffset(
										y - blockHeight - scrollAdjustmentY
									);
								} else if (
									py + blockHeight + scrollAdjustmentY >
									window.height
								) {
									scrollToBlockListOffset( y );
								}
							}
						);
					}
				);
			}
		}
	}

	render() {
		const {
			blockAlignment,
			clientId,
			isReadOnly,
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			contentResizeMode,
			shouldShowInnerBlockAppender,
			...restProps
		} = this.props;
		const readableContentViewStyle =
			contentResizeMode === 'stretch' && stretchStyle;

		return (
			<ReadableContentView
				align={ blockAlignment }
				style={ readableContentViewStyle }
			>
				<View
					ref={ this.blockRef }
					style={ this.getContentStyles( readableContentViewStyle ) }
					pointerEvents={ isReadOnly ? 'box-only' : 'auto' }
					onLayout={ this.onLayout }
				>
					{ shouldShowInsertionPointBefore && (
						<BlockInsertionPoint />
					) }
					<BlockListBlock
						key={ clientId }
						listRef={ this.props.listRef }
						scrollTo={ this.props.scrollTo }
						showTitle={ false }
						clientId={ clientId }
						{ ...restProps }
						marginHorizontal={ this.getMarginHorizontal() }
					/>
					{ ! shouldShowInnerBlockAppender() &&
						shouldShowInsertionPointAfter && (
							<BlockInsertionPoint />
						) }
				</View>
			</ReadableContentView>
		);
	}
}

export default compose( [
	withSelect(
		( select, { rootClientId, isStackedHorizontally, clientId } ) => {
			const {
				getBlockOrder,
				getBlockInsertionPoint,
				isBlockInsertionPointVisible,
				getSettings,
				getBlockParents,
				__unstableGetBlockWithoutInnerBlocks,
				isBlockSelected,
			} = select( 'core/block-editor' );

			const blockClientIds = getBlockOrder( rootClientId );
			const insertionPoint = getBlockInsertionPoint();
			const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
			const shouldShowInsertionPointBefore =
				! isStackedHorizontally &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if list is empty, show the insertion point (via the default appender)
				( blockClientIds.length === 0 ||
					// or if the insertion point is right before the denoted block
					blockClientIds[ insertionPoint.index ] === clientId );

			const shouldShowInsertionPointAfter =
				! isStackedHorizontally &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if the insertion point is at the end of the list
				blockClientIds.length === insertionPoint.index &&
				// and the denoted block is the last one on the list, show the indicator at the end of the block
				blockClientIds[ insertionPoint.index - 1 ] === clientId;

			const isReadOnly = getSettings().readOnly;

			const block = __unstableGetBlockWithoutInnerBlocks( clientId );
			const { attributes } = block || {};
			const { align } = attributes || {};
			const isSelected = isBlockSelected( clientId );
			const parents = getBlockParents( clientId, true );
			const hasParents = !! parents.length;
			const parentBlock = hasParents
				? __unstableGetBlockWithoutInnerBlocks( parents[ 0 ] )
				: {};
			const { align: parentBlockAlignment } =
				parentBlock?.attributes || {};

			return {
				isSelected,
				shouldShowInsertionPointBefore,
				shouldShowInsertionPointAfter,
				isReadOnly,
				hasParents,
				blockAlignment: align,
				parentBlockAlignment,
			};
		}
	),
] )( BlockListItem );
