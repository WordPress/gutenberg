/**
 * WordPress dependencies
 */
// @ts-expect-error: Not typed yet.
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { NavigationButtonAsItem } from '../navigation-button';
import { useSetting } from '../hooks';

interface BlockStyle {
	name: string;
	label: string;
	source?: string;
	isDefault?: boolean;
}

interface VariationsPanelProps {
	name: string;
}

// Only core block styles (source === block) or block styles with a matching
// theme.json style variation will be configurable via Global Styles.
function getFilteredBlockStyles(
	blockStyles: BlockStyle[],
	variations: string[]
): BlockStyle[] {
	return (
		blockStyles?.filter(
			( style ) =>
				style.source === 'block' || variations.includes( style.name )
		) || []
	);
}

export function useBlockVariations( name: string ): BlockStyle[] {
	const blockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);
	const [ variations ] = useSetting( 'variations', name );
	const variationNames = Object.keys( variations ?? {} );

	return getFilteredBlockStyles( blockStyles, variationNames );
}

export function VariationsPanel( { name }: VariationsPanelProps ) {
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
					>
						{ style.label }
					</NavigationButtonAsItem>
				);
			} ) }
		</ItemGroup>
	);
}
