/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
/**
 * Internal dependencies
 */

import { NavigationButtonAsItem } from './navigation-button';

function getCoreBlockStyles( blockStyles ) {
	return blockStyles?.filter( ( style ) => style.source === 'block' );
}

export function useBlockVariations( name ) {
	const blockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);
	const coreBlockStyles = getCoreBlockStyles( blockStyles );
	return coreBlockStyles;
}

export function VariationsPanel( { name } ) {
	const coreBlockStyles = useBlockVariations( name );

	return (
		<ItemGroup isBordered isSeparated>
			{ coreBlockStyles.map( ( style, index ) => {
				if ( style?.isDefault ) {
					return null;
				}
				return (
					<NavigationButtonAsItem
						key={ index }
						path={
							'/blocks/' +
							encodeURIComponent( name ) +
							'/variations/' +
							encodeURIComponent( style.name )
						}
						aria-label={ style.label }
					>
						{ style.label }
					</NavigationButtonAsItem>
				);
			} ) }
		</ItemGroup>
	);
}
