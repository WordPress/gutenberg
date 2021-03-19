/**
 * WordPress dependencies
 */

import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';
import { useMemo, useRef } from '@wordpress/element';
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
 * @param {string}  props.selectedBlockClientId                    Deprecated. See props.selectedBlockClientIds.
 * @param {Array}   props.selectedBlockClientIds                   List of selected block client IDs.
 */
export default function BlockNavigationTree( {
	__experimentalFeatures,
	__experimentalPersistentListViewFeatures,
	selectedBlockClientId,
	selectedBlockClientIds,
	...props
} ) {
	const treeGridRef = useRef();
	let blockDropTarget = useBlockNavigationDropZone( treeGridRef );

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

	// Deprecate selectedBlockClientId
	if ( selectedBlockClientId ) {
		deprecated(
			'selectedBlockClientId (singular) prop of the BlockNavigationTree component',
			{
				alternative:
					'selectedBlockClientIds (renamed to plural) of the BlockNavigationTree component',
				hint: 'The renamed prop is an array',
			}
		);
	}
	// Convert selectedBlockClientId to selectedBlockClientIds for backward compatibility.
	const updatedProps = {
		...props,
		selectedBlockClientIds:
			selectedBlockClientId && ! selectedBlockClientIds
				? [ selectedBlockClientId ]
				: selectedBlockClientIds,
	};

	return (
		<TreeGrid
			className="block-editor-block-navigation-tree"
			aria-label={ __( 'Block navigation structure' ) }
			ref={ treeGridRef }
		>
			<BlockNavigationContext.Provider value={ contextValue }>
				<BlockNavigationBranch { ...updatedProps } />
			</BlockNavigationContext.Provider>
		</TreeGrid>
	);
}
