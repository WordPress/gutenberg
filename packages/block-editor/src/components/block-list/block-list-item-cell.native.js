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

function BlockListItemCell( { children, clientId, rootClientId, onLayout } ) {
	const { blocksLayouts, updateBlocksLayouts } = useBlockListContext();

	useEffect( () => {
		return () => {
			updateBlocksLayouts( blocksLayouts, {
				clientId,
				shouldRemove: true,
			} );
		};
	}, [] );

	const onCellLayout = useCallback(
		( event ) => {
			const {
				nativeEvent: { layout },
			} = event;
			updateBlocksLayouts( blocksLayouts, {
				clientId,
				rootClientId,
				...layout,
			} );

			if ( onLayout ) {
				onLayout( event );
			}
		},
		[ clientId, rootClientId, updateBlocksLayouts, onLayout ]
	);

	return <View onLayout={ onCellLayout }>{ children }</View>;
}

export default BlockListItemCell;
