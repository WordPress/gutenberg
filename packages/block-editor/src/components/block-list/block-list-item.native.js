/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
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
			hasParents,
			blockName,
			parentBlockName,
		} = this.props;
		const { blockWidth } = this.state;
		const { medium } = ALIGNMENT_BREAKPOINTS;
		const { alignments, innerContainers } = WIDE_ALIGNMENTS;
		const isFullWidth = blockAlignment === alignments.full;
		const isWideWidth = blockAlignment === alignments.wide;
		const isParentFullWidth = parentBlockAlignment === alignments.full;

		if ( isFullWidth ) {
			if ( ! hasParents ) {
				return 0;
			}
			return marginHorizontal;
		}

		if ( isWideWidth ) {
			return marginHorizontal;
		}

		if ( isParentFullWidth && blockWidth <= medium ) {
			const isContainerRelated = innerContainers.includes( blockName );
			const isParentContainerRelated = innerContainers.includes(
				parentBlockName
			);

			if ( isContainerRelated || isParentContainerRelated ) {
				return marginHorizontal;
			}
			return marginHorizontal * 2;
		}

		return marginHorizontal;
	}

	getContentStyles( readableContentViewStyle ) {
		const { blockAlignment, hasParents, parentBlockName } = this.props;
		const { alignments, innerContainers } = WIDE_ALIGNMENTS;

		const isFullWidth = blockAlignment === alignments.full;

		const isParentContainerRelated = innerContainers.includes(
			parentBlockName
		);

		return [
			readableContentViewStyle,
			isFullWidth &&
				! hasParents && {
					width: styles.fullAlignment.width,
				},
			! blockAlignment &&
				hasParents &&
				! isParentContainerRelated && {
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
			parentWidth,
			...restProps
		} = this.props;
		const readableContentViewStyle =
			contentResizeMode === 'stretch' && stretchStyle;

		return (
			<ReadableContentView
				align={ blockAlignment }
				style={ readableContentViewStyle }
				parentWidth={ parentWidth }
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
						parentWidth={ parentWidth }
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
			const { attributes, name } = block || {};
			const { align } = attributes || {};
			const parents = getBlockParents( clientId, true );
			const hasParents = !! parents.length;
			const parentBlock = hasParents
				? __unstableGetBlockWithoutInnerBlocks( parents[ 0 ] )
				: {};
			const { align: parentBlockAlignment } =
				parentBlock?.attributes || {};
			const { name: parentBlockName } = parentBlock || {};

			return {
				shouldShowInsertionPointBefore,
				shouldShowInsertionPointAfter,
				isReadOnly,
				hasParents,
				blockAlignment: align,
				parentBlockAlignment,
				blockName: name,
				parentBlockName,
			};
		}
	),
] )( BlockListItem );
