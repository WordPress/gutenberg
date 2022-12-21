/**
 * WordPress dependencies
 */
import { store as blocksStore, registerBlockStyle } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */

import { NavigationButtonAsItem } from './navigation-button';
import ContextMenu from './context-menu';

function getCoreBlockStyles( blockStyles ) {
	return blockStyles?.filter( ( style ) => style.source === 'block' );
}

function getUserBlockStyles( blockStyles ) {
	return blockStyles?.filter( ( style ) => style.source === 'user' );
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
	const userBlockStyles = getUserBlockStyles( blockStyles );
	return (
		( !! coreBlockStyles?.length || !! userBlockStyles?.length ) &&
		! isInsideVariationsPanel
	);
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
	const userBlockStyles = getUserBlockStyles( blockStyles );
	const allBlockStyles = [ ...coreBlockStyles, ...userBlockStyles ];
	return (
		<>
			<p>
				Manage and create style variations, saved block appearance
				presets
			</p>
			<Button
				variant="primary"
				onClick={ () => {
					registerBlockStyle( name, {
						name: `custom-style-${ userBlockStyles?.length + 1 }`,
						label: `Custom Style ${ userBlockStyles?.length + 1 }`,
						source: 'user',
					} );
				} }
			>
				Create new style variation
			</Button>
			{ allBlockStyles.map( ( style, index ) => (
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
