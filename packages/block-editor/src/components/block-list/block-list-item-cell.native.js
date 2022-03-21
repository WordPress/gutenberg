/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockListContext } from './block-list-context';
import BlockDraggable from '../block-draggable';

function BlockListItemCell( { children, clientId, rootClientId } ) {
	const { blocksLayouts, updateBlocksLayouts } = useBlockListContext();

	useEffect( () => {
		return () => {
			updateBlocksLayouts( blocksLayouts, {
				clientId,
				shouldRemove: true,
			} );
		};
	}, [] );

	const onLayout = useCallback(
		( { nativeEvent: { layout } } ) => {
			updateBlocksLayouts( blocksLayouts, {
				clientId,
				rootClientId,
				...layout,
			} );
		},
		[ clientId, rootClientId, updateBlocksLayouts ]
	);

	return (
		<BlockDraggable clientIds={ [ clientId ] }>
			{ () => <View onLayout={ onLayout }>{ children }</View> }
		</BlockDraggable>
	);
}

export default BlockListItemCell;
