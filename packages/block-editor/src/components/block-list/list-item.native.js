/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import BlockInsertionPoint from './insertion-point';

export function BlockListItem( {
	clientId,
	isReadOnly,
	shouldShowInsertionPointBefore,
	shouldShowInsertionPointAfter,
	marginVertical = styles.defaultBlock.marginTop,
	marginHorizontal = styles.defaultBlock.marginLeft,
	isStackedHorizontally,
	contentResizeMode,
	contentStyle,
	onAddBlock,
	onDeleteBlock,
	shouldShowInnerBlockAppender,
} ) {
	const readableContentViewStyle = contentResizeMode === 'stretch' && {
		flex: 1,
	};

	return (
		<ReadableContentView style={ readableContentViewStyle }>
			<View
				style={ readableContentViewStyle }
				pointerEvents={ isReadOnly ? 'box-only' : 'auto' }
			>
				{ shouldShowInsertionPointBefore && <BlockInsertionPoint /> }
				<BlockListBlock
					key={ clientId }
					showTitle={ false }
					clientId={ clientId }
					marginVertical={ marginVertical }
					marginHorizontal={ marginHorizontal }
					rootClientId={ this.props.rootClientId }
					onCaretVerticalPositionChange={
						this.onCaretVerticalPositionChange
					}
					parentWidth={ this.props.parentWidth }
					isStackedHorizontally={ isStackedHorizontally }
					contentStyle={ contentStyle }
					onAddBlock={ onAddBlock }
					onDeleteBlock={ onDeleteBlock }
				/>
				{ ! shouldShowInnerBlockAppender &&
					shouldShowInsertionPointAfter && <BlockInsertionPoint /> }
			</View>
		</ReadableContentView>
	);
}

export default compose( [
	withSelect(
		( select, { rootClientId, isStackedHorizontally, clientId } ) => {
			const {
				getBlockOrder,
				getBlockInsertionPoint,
				isBlockInsertionPointVisible,
				getSettings,
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

			return {
				shouldShowInsertionPointBefore,
				shouldShowInsertionPointAfter,
				isReadOnly,
			};
		}
	),
] )( BlockListItem );
