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

	return <View onLayout={ onLayout }>{ children }</View>;
}

export default BlockListItemCell;
