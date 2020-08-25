/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockInsertionPoint from './insertion-point';
import styles from './block-list-item.native.scss';

const BREAKPOINTS = {
	wide: 1024,
	medium: 740,
	small: 480,
};

const stretchStyle = {
	flex: 1,
};

const WIDE_ALIGNMENTS = [ 'wide', 'full' ];

export class BlockListItem extends Component {
	constructor() {
		super( ...arguments );

		this.onLayout = this.onLayout.bind( this );

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

	getWideMargins() {
		const {
			marginHorizontal,
			parentBlockAlignment,
			numberOfParents,
		} = this.props;
		const { blockWidth } = this.state;
		const screenWidth = Dimensions.get( 'window' ).width;

		if ( screenWidth > BREAKPOINTS.wide ) {
			return marginHorizontal * 2;
		} else if (
			screenWidth <= BREAKPOINTS.small &&
			numberOfParents === 0
		) {
			return marginHorizontal;
		}

		if (
			blockWidth - styles.fullAlignmentPadding.paddingLeft <=
			BREAKPOINTS.medium
		) {
			if ( numberOfParents === 0 ) {
				return marginHorizontal * 3;
			} else if (
				parentBlockAlignment === 'full' &&
				blockWidth > BREAKPOINTS.small
			) {
				return marginHorizontal * 4;
			}
		}

		if (
			blockWidth > BREAKPOINTS.small &&
			blockWidth < BREAKPOINTS.wide &&
			blockWidth - styles.wideMargin.marginLeft >= BREAKPOINTS.medium
		) {
			return blockWidth > screenWidth
				? marginHorizontal * 4
				: marginHorizontal * 3;
		}

		return marginHorizontal * 2;
	}

	getMarginHorizontal() {
		const {
			blockAlignment,
			marginHorizontal,
			parentBlockAlignment,
			numberOfParents,
		} = this.props;
		const { blockWidth } = this.state;

		if ( blockAlignment === 'full' ) {
			return 0;
		}

		if ( blockAlignment === 'wide' ) {
			return this.getWideMargins();
		}

		return WIDE_ALIGNMENTS.includes( parentBlockAlignment ) &&
			numberOfParents === 1 &&
			blockWidth < BREAKPOINTS.small
			? marginHorizontal * 2
			: marginHorizontal;
	}

	getContentStyles( readableContentViewStyle ) {
		const { blockAlignment, hasParents } = this.props;
		const isFullWidth = blockAlignment === 'full';

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
					style={ this.getContentStyles( readableContentViewStyle ) }
					pointerEvents={ isReadOnly ? 'box-only' : 'auto' }
					onLayout={ this.onLayout }
				>
					{ shouldShowInsertionPointBefore && (
						<BlockInsertionPoint />
					) }
					<BlockListBlock
						key={ clientId }
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
			const parents = getBlockParents( clientId, true );
			const hasParents = !! parents.length;
			const parentBlock = hasParents
				? __unstableGetBlockWithoutInnerBlocks( parents[ 0 ] )
				: {};
			const { align: parentBlockAlignment } =
				parentBlock?.attributes || {};

			return {
				shouldShowInsertionPointBefore,
				shouldShowInsertionPointAfter,
				isReadOnly,
				hasParents,
				blockAlignment: align,
				parentBlockAlignment,
				numberOfParents: parents.length,
			};
		}
	),
] )( BlockListItem );
