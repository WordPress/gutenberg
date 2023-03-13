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
import { ReadableContentView, alignmentHelpers } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockInsertionPoint from './insertion-point';
import Grid from './grid-item';

import styles from './block-list-item.native.scss';
import { store as blockEditorStore } from '../../store';

const stretchStyle = {
	flex: 1,
};

export class BlockListItem extends Component {
	getMarginHorizontal() {
		const {
			blockAlignment,
			marginHorizontal,
			parentBlockAlignment,
			hasParents,
			blockName,
			parentBlockName,
			parentWidth,
			blockWidth,
		} = this.props;
		const { isFullWidth, isWideWidth, isWider, isContainerRelated } =
			alignmentHelpers;

		if ( isFullWidth( blockAlignment ) ) {
			if ( ! hasParents ) {
				return 0;
			}
			return marginHorizontal;
		}
		if ( isWideWidth( blockAlignment ) ) {
			return marginHorizontal;
		}

		const screenWidth = Math.floor( Dimensions.get( 'window' ).width );

		if (
			isFullWidth( parentBlockAlignment ) &&
			! isWider( blockWidth, 'medium' )
		) {
			if (
				isContainerRelated( blockName ) ||
				isWider( screenWidth, 'mobile' )
			) {
				return marginHorizontal;
			}
			return marginHorizontal * 2;
		}

		if (
			isContainerRelated( parentBlockName ) &&
			! isContainerRelated( blockName )
		) {
			const isScreenWidthEqual = parentWidth === screenWidth;
			if ( isScreenWidthEqual || isWider( screenWidth, 'mobile' ) ) {
				return marginHorizontal;
			}
		}

		return marginHorizontal;
	}

	getContentStyles( readableContentViewStyle ) {
		const { blockAlignment, blockName, hasParents, parentBlockName } =
			this.props;
		const { isFullWidth, isContainerRelated } = alignmentHelpers;

		return [
			readableContentViewStyle,
			isFullWidth( blockAlignment ) &&
				! hasParents && {
					width: styles.fullAlignment.width,
				},
			! blockAlignment &&
				hasParents &&
				! isContainerRelated( parentBlockName ) &&
				isContainerRelated( blockName ) && {
					paddingHorizontal: styles.fullAlignmentPadding.paddingLeft,
				},
		];
	}

	renderContent() {
		const {
			blockAlignment,
			clientId,
			isReadOnly,
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			contentResizeMode,
			shouldShowInnerBlockAppender,
			parentWidth,
			marginHorizontal,
			blockName,
			blockWidth,
			...restProps
		} = this.props;

		const readableContentViewStyle =
			contentResizeMode === 'stretch' && stretchStyle;
		const { isContainerRelated } = alignmentHelpers;

		return (
			<ReadableContentView
				align={ blockAlignment }
				style={ [
					readableContentViewStyle,
					isContainerRelated( blockName ) &&
						parentWidth && {
							maxWidth: parentWidth + 2 * marginHorizontal,
						},
				] }
			>
				<View
					style={ this.getContentStyles( readableContentViewStyle ) }
					pointerEvents={ isReadOnly ? 'box-only' : 'auto' }
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
						blockWidth={ blockWidth }
					/>
					{ ! shouldShowInnerBlockAppender() &&
						shouldShowInsertionPointAfter && (
							<BlockInsertionPoint />
						) }
				</View>
			</ReadableContentView>
		);
	}

	render() {
		const { parentWidth, blockWidth, isGridItem } = this.props;

		if ( ! blockWidth ) {
			return null;
		}

		if ( isGridItem ) {
			const { numOfColumns, tileCount, tileIndex } = this.props;
			return (
				<Grid
					maxWidth={ parentWidth }
					numOfColumns={ numOfColumns }
					tileCount={ tileCount }
					index={ tileIndex }
				>
					{ this.renderContent() }
				</Grid>
			);
		}
		return this.renderContent();
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
				getBlock,
			} = select( blockEditorStore );

			const blockClientIds = getBlockOrder( rootClientId );
			const insertionPoint = getBlockInsertionPoint();
			const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
			const shouldShowInsertionPointBefore =
				! isStackedHorizontally &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// If list is empty, show the insertion point (via the default appender)
				( blockClientIds.length === 0 ||
					// Or if the insertion point is right before the denoted block.
					blockClientIds[ insertionPoint.index ] === clientId );

			const shouldShowInsertionPointAfter =
				! isStackedHorizontally &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// If the insertion point is at the end of the list.
				blockClientIds.length === insertionPoint.index &&
				// And the denoted block is the last one on the list, show the indicator at the end of the block.
				blockClientIds[ insertionPoint.index - 1 ] === clientId;

			const isReadOnly = getSettings().readOnly;

			const { attributes, name } = getBlock( clientId ) || {};
			const { align } = attributes || {};
			const parents = getBlockParents( clientId, true );
			const hasParents = !! parents.length;
			const parentBlock = hasParents ? getBlock( parents[ 0 ] ) : {};
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
