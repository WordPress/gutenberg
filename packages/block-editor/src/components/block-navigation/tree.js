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

/**
 * Wrap `BlockNavigationRows` with `TreeGrid`. BlockNavigationRows is a
 * recursive component (it renders itself), so this ensures TreeGrid is only
 * present at the very top of the navigation grid.
 *
 * @param {Object} props
 */
export default function BlockNavigationTree( {
	__experimentalWithBlockNavigationSlots,
	__experimentalWithEllipsisMenu,
	__experimentalWithEllipsisMenuMinLevel,
	...props
} ) {
	const contextValue = useMemo(
		() => ( {
			__experimentalWithBlockNavigationSlots,
			__experimentalWithEllipsisMenu,
			__experimentalWithEllipsisMenuMinLevel:
				typeof __experimentalWithEllipsisMenuMinLevel === 'number'
					? __experimentalWithEllipsisMenuMinLevel
					: 0,
		} ),
		[
			__experimentalWithBlockNavigationSlots,
			__experimentalWithEllipsisMenu,
			__experimentalWithEllipsisMenuMinLevel,
		]
	);

	return (
		<TreeGrid
			className="block-editor-block-navigation-tree"
			aria-label={ __( 'Block navigation structure' ) }
		>
			<BlockNavigationContext.Provider value={ contextValue }>
				<BlockNavigationBranch { ...props } />
			</BlockNavigationContext.Provider>
		</TreeGrid>
	);
}
