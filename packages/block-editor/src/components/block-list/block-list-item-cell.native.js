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

function BlockListItemCell( {
	children,
	clientId,
	rootClientId,
	listOnLayout,
} ) {
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
		( event ) => {
			const {
				nativeEvent: { layout },
			} = event;
			updateBlocksLayouts( blocksLayouts, {
				clientId,
				rootClientId,
				...layout,
			} );

			if ( listOnLayout ) {
				listOnLayout( event );
			}
		},
		[ clientId, rootClientId, updateBlocksLayouts, listOnLayout ]
	);

	return <View onLayout={ onLayout }>{ children }</View>;
}

export default BlockListItemCell;
