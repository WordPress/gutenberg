/**
 * WordPress dependencies
 */

import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import BlockNavigationBranch from './branch';
import { BlockNavigationContext } from './context';
import useBlockNavigationDropZone from './use-block-navigation-drop-zone';

/**
 * Wrap `BlockNavigationRows` with `TreeGrid`. BlockNavigationRows is a
 * recursive component (it renders itself), so this ensures TreeGrid is only
 * present at the very top of the navigation grid.
 *
 * @param {Object}  props                                          Components props.
 * @param {boolean} props.__experimentalFeatures                   Flag to enable experimental features.
 * @param {boolean} props.__experimentalPersistentListViewFeatures Flag to enable features for the Persistent List View experiment.
 */
export default function BlockNavigationTree( {
	__experimentalFeatures,
	__experimentalPersistentListViewFeatures,
	...props
} ) {
	let {
		ref: treeGridRef,
		target: blockDropTarget,
	} = useBlockNavigationDropZone();

	if ( ! __experimentalFeatures ) {
		blockDropTarget = undefined;
	}

	const contextValue = useMemo(
		() => ( {
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			blockDropTarget,
		} ),
		[
			__experimentalFeatures,
			__experimentalPersistentListViewFeatures,
			blockDropTarget,
		]
	);

	return (
		<TreeGrid
			className="block-editor-block-navigation-tree"
			aria-label={ __( 'Block navigation structure' ) }
			ref={ treeGridRef }
		>
			<BlockNavigationContext.Provider value={ contextValue }>
				<BlockNavigationBranch { ...props } />
			</BlockNavigationContext.Provider>
		</TreeGrid>
	);
}
