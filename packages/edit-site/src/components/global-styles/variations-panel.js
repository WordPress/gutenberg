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

export function useHasVariationsPanel( name, parentMenu = '' ) {
	const isInsideVariationsPanel = parentMenu.includes( 'variations' );
	const blockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);
	return !! blockStyles?.length && ! isInsideVariationsPanel;
}

export function VariationsPanel( { name } ) {
	const blockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);

	return (
		<>
			{ blockStyles.map( ( style, index ) => (
				<NavigationButtonAsItem
					key={ index }
					icon={ '+' }
					path={ '/blocks/' + name + '/variations/' + style.name }
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
			parentMenu={ '/blocks/' + blockName + '/variations/' + styleName }
			name={ blockName }
		/>
	);
}
