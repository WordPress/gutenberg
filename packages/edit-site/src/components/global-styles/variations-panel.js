/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */

import { NavigationButtonAsItem } from './navigation-button';
import ContextMenu from './context-menu';

function getCoreBlockStyles( blockStyles ) {
	return blockStyles?.filter( ( style ) => style.source === 'block' );
}

export function useHasVariationsPanel( name, parentMenu = '' ) {
	const isInsideVariationsPanel = parentMenu.includes( 'variations' );
	const blockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);
	const coreBlockStyles = getCoreBlockStyles( blockStyles );
	return !! coreBlockStyles?.length && ! isInsideVariationsPanel;
}

export function VariationsPanel( { name } ) {
	const blockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);
	const coreBlockStyles = getCoreBlockStyles( blockStyles );

	return (
		<>
			{ coreBlockStyles.map( ( style, index ) => (
				<NavigationButtonAsItem
					key={ index }
					icon={ '+' }
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
			) ) }
		</>
	);
}

export function VariationPanel( { blockName, styleName } ) {
	return (
		<ContextMenu
			parentMenu={
				'/blocks/' +
				encodeURIComponent( blockName ) +
				'/variations/' +
				encodeURIComponent( styleName )
			}
			name={ blockName }
		/>
	);
}
