/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import BlockInsertionPoint from './insertion-point';
import BlockListAppender from '../block-list-appender';

/**
 * NOTE: This component is only used by the List (V2) and Group blocks. It only
 * passes the props required for these blocks. To use it with other blocks,
 * update this component to support any additional props required by the new
 * block: components/inner-blocks/index.native.js
 */

function BlockListCompact( props ) {
	const {
		blockWidth,
		orientation,
		marginHorizontal = styles.defaultBlock.marginLeft,
		marginVertical = styles.defaultBlock.marginTop,
		parentWidth,
		renderAppender,
		rootClientId,
	} = props;
	const {
		blockClientIds,
		isParentSelected,
		shouldShowInsertionPointBefore,
		shouldShowInsertionPointAfter,
	} = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getSelectedBlockClientId,
				getBlockInsertionPoint,
				isBlockInsertionPointVisible,
			} = select( blockEditorStore );
			const blockOrder = getBlockOrder( rootClientId );

			const selectedBlockClientId = getSelectedBlockClientId();

			const isStackedHorizontally = orientation === 'horizontal';
			const insertionPoint = getBlockInsertionPoint();
			const blockInsertionPointIsVisible = isBlockInsertionPointVisible();

			return {
				blockClientIds: blockOrder,
				isParentSelected:
					rootClientId === selectedBlockClientId ||
					( ! rootClientId && ! selectedBlockClientId ),
				shouldShowInsertionPointBefore( currentClientId ) {
					return (
						! isStackedHorizontally &&
						blockInsertionPointIsVisible &&
						insertionPoint.rootClientId === rootClientId &&
						// If list is empty, show the insertion point (via the default appender)
						( blockOrder.length === 0 ||
							// Or if the insertion point is right before the denoted block.
							blockOrder[ insertionPoint.index ] ===
								currentClientId )
					);
				},
				shouldShowInsertionPointAfter( currentClientId ) {
					return (
						! isStackedHorizontally &&
						blockInsertionPointIsVisible &&
						insertionPoint.rootClientId === rootClientId &&
						// If the insertion point is at the end of the list.
						blockOrder.length === insertionPoint.index &&
						// And the denoted block is the last one on the list, show the indicator at the end of the block.
						blockOrder[ insertionPoint.index - 1 ] ===
							currentClientId
					);
				},
			};
		},
		[ rootClientId ]
	);

	const containerStyle = {
		marginVertical: -marginVertical,
		marginHorizontal: -marginHorizontal,
	};

	const isEmptylist = blockClientIds.length === 0;

	return (
		<View style={ containerStyle } testID="block-list-wrapper">
			{ blockClientIds.map( ( currentClientId, index ) => (
				<View key={ currentClientId }>
					{ shouldShowInsertionPointBefore( currentClientId ) && (
						<BlockInsertionPoint
							testID={ `block-insertion-point-before-row-${
								index + 1
							}` }
						/>
					) }
					<BlockListBlock
						blockWidth={ blockWidth }
						parentWidth={ parentWidth }
						clientId={ currentClientId }
						rootClientId={ rootClientId }
						marginHorizontal={ marginHorizontal }
						marginVertical={ marginVertical }
					/>
					{ ! ( renderAppender && blockClientIds.length > 0 ) &&
						shouldShowInsertionPointAfter( currentClientId ) && (
							<BlockInsertionPoint
								testID={ `block-insertion-point-after-row-${
									index + 1
								}` }
							/>
						) }
				</View>
			) ) }
			{ renderAppender && isParentSelected && (
				<View
					style={ {
						marginVertical:
							isEmptylist && styles.defaultAppender.marginTop,
						marginHorizontal:
							! isEmptylist &&
							marginHorizontal - styles.innerAppender.marginLeft,
					} }
				>
					<BlockListAppender
						rootClientId={ rootClientId }
						renderAppender={ renderAppender }
						showSeparator
					/>
				</View>
			) }
		</View>
	);
}

export default BlockListCompact;
