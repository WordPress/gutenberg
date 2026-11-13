import { __ } from '@wordpress/i18n';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useContext, useMemo } from '@wordpress/element';
import type { BlockType } from '@wordpress/blocks';
import { ScreenBody } from './screen-body';
import { Subtitle } from './subtitle';
import { BlockMenuItem } from './screen-block-list';
import { GlobalStylesContext } from './context';
import { getOverridingBlockTypes } from './utils';

interface ElementBlockOverridesProps {
	element: string;
	blockTypes: BlockType[];
}

export default function ElementBlockOverrides( {
	element,
	blockTypes,
}: ElementBlockOverridesProps ) {
	const { merged } = useContext( GlobalStylesContext );
	const overridingBlockTypes = useMemo( () => {
		const names = getOverridingBlockTypes(
			merged,
			element,
			blockTypes.map( ( blockType ) => blockType.name )
		);
		return blockTypes.filter( ( blockType ) =>
			names.includes( blockType.name )
		);
	}, [ merged, element, blockTypes ] );

	if ( ! overridingBlockTypes.length ) {
		return null;
	}

	return (
		<ScreenBody>
			<Stack direction="column" gap="sm">
				<Subtitle level={ 3 }>{ __( 'Overridden by' ) }</Subtitle>
				<ItemGroup
					isBordered
					isSeparated
					className="global-styles-ui-block-types-item-list global-styles-ui-element-block-overrides__list"
				>
					{ overridingBlockTypes.map( ( block ) => (
						<BlockMenuItem block={ block } key={ block.name } />
					) ) }
				</ItemGroup>
			</Stack>
		</ScreenBody>
	);
}
