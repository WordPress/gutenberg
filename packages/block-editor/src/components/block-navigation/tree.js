/**
 * WordPress dependencies
 */

import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationBranch from './branch';
import { BlockNavigationContext } from './context';
import BlockNavigationDropIndicator from './drop-indicator';
import useBlockNavigationDropZone from './use-block-navigation-drop-zone';

/**
 * Wrap `BlockNavigationRows` with `TreeGrid`. BlockNavigationRows is a
 * recursive component (it renders itself), so this ensures TreeGrid is only
 * present at the very top of the navigation grid.
 *
 * @param {Object} props                        Components props.
 * @param {Object} props.__experimentalFeatures Object used in context provider.
 */
export default function BlockNavigationTree( {
	__experimentalFeatures,
	...props
} ) {
	const treeGridRef = useRef();
	const blockDropTarget = useBlockNavigationDropZone( treeGridRef );
	const contextValue = useMemo(
		() => ( {
			__experimentalFeatures,
			blockDropTarget,
		} ),
		[ __experimentalFeatures, blockDropTarget ]
	);

	return (
		<>
			<TreeGrid
				className="block-editor-block-navigation-tree"
				aria-label={ __( 'Block navigation structure' ) }
				ref={ treeGridRef }
			>
				<BlockNavigationContext.Provider value={ contextValue }>
					<BlockNavigationBranch { ...props } />
				</BlockNavigationContext.Provider>
			</TreeGrid>
			<BlockNavigationDropIndicator dropTarget={ blockDropTarget } />
		</>
	);
}
