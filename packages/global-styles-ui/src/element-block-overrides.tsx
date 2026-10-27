import { __ } from '@wordpress/i18n';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { ScreenBody } from './screen-body';
import { Subtitle } from './subtitle';
import { BlockMenuItem } from './screen-block-list';
import { GlobalStylesContext } from './context';
import { getOverridingBlockTypes } from './utils';

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
		<ScreenBody>
			<Stack direction="column" gap="sm">
				<Subtitle level={ 3 }>{ __( 'Overridden by' ) }</Subtitle>
				<ItemGroup
					isBordered
					isSeparated
					className="global-styles-ui-block-types-item-list"
				>
					{ blockTypes.map( ( block ) => (
						<BlockMenuItem block={ block } key={ block.name } />
					) ) }
				</ItemGroup>
			</Stack>
		</ScreenBody>
	);
}
