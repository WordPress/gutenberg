import { __ } from '@wordpress/i18n';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
// @ts-expect-error: Not typed yet.
import { BlockIcon } from '@wordpress/block-editor';
import { NavigationButtonAsItem } from './navigation-button';
import { Subtitle } from './subtitle';
import {
	getOverridingBlockTypes,
	useBlockHasGlobalStyles,
} from './screen-block-list';
import { GlobalStylesContext } from './context';

function BlockOverrideItem( { block }: { block: BlockType } ) {
	const hasGlobalStyles = useBlockHasGlobalStyles( block.name );
	if ( ! hasGlobalStyles ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ '/blocks/' + encodeURIComponent( block.name ) }
		>
			<Stack direction="row" align="center" gap="sm">
				<BlockIcon
					className="global-styles-ui-block-types-item__icon"
					icon={ block.icon }
				/>
				<span>{ block.title }</span>
			</Stack>
		</NavigationButtonAsItem>
	);
}

interface ElementBlockOverridesProps {
	element: string;
}

export default function ElementBlockOverrides( {
	element,
}: ElementBlockOverridesProps ) {
	const { merged } = useContext( GlobalStylesContext );
	const allBlockTypes = useSelect(
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);
	const blockTypes = useMemo( () => {
		const names = getOverridingBlockTypes( merged, element );
		return names
			.map( ( name ) =>
				allBlockTypes.find( ( blockType ) => blockType.name === name )
			)
			.filter( ( blockType ): blockType is BlockType => !! blockType );
	}, [ merged, element, allBlockTypes ] );

	if ( ! blockTypes.length ) {
		return null;
	}

	return (
		<div className="global-styles-ui-element-block-overrides">
			<Stack direction="column" gap="sm">
				<Subtitle level={ 3 }>{ __( 'Applies to' ) }</Subtitle>
				<ItemGroup
					isBordered
					isSeparated
					className="global-styles-ui-block-types-item-list"
				>
					{ blockTypes.map( ( block ) => (
						<BlockOverrideItem block={ block } key={ block.name } />
					) ) }
				</ItemGroup>
			</Stack>
		</div>
	);
}
