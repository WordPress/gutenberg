import { __ } from '@wordpress/i18n';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import { ScreenBody } from './screen-body';
import { Subtitle } from './subtitle';
import { BlockMenuItem } from './screen-block-list';
import { unlock } from './lock-unlock';
import { GlobalStylesContext } from './context';

const { getBlockTypesForElement } = unlock( blockEditorPrivateApis );
const { resolveStyle } = unlock( globalStylesEnginePrivateApis );

// Heading blocks render at any level, so every heading screen shares one list.
const HEADING_ELEMENTS = [ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ];

function getElementKeys( element: string ): string[] {
	return HEADING_ELEMENTS.includes( element )
		? HEADING_ELEMENTS
		: [ element ];
}

// State and viewport styles go to other selectors, so they cannot override
// the element itself.
function isOwnStylePath( path: string ) {
	return ! path.startsWith( ':' ) && ! path.startsWith( '@' );
}

/**
 * The block types an element paints whose own Global Styles beat the element
 * for at least one property it sets. Block style variations are not counted.
 *
 * @param config  Merged Global Styles config.
 * @param element Element key, e.g. `heading`, `h2` or `button`.
 * @return Block names, in map order.
 */
export function getOverridingBlockTypes(
	config: GlobalStylesConfig | undefined,
	element: string
): string[] {
	const blockNames: string[] = getBlockTypesForElement( element );
	if ( ! blockNames.length || ! config?.styles ) {
		return [];
	}
	const elements = getElementKeys( element );
	// Any block name works here: with block styles dropped, only root and element layers remain.
	const { sources: elementSources } = resolveStyle(
		{ ...config, styles: { ...config.styles, blocks: undefined } },
		{ blockName: blockNames[ 0 ], elements }
	);
	return blockNames.filter( ( blockName ) => {
		const { sources } = resolveStyle( config, { blockName, elements } );
		return Object.keys( sources ).some(
			( path ) =>
				isOwnStylePath( path ) &&
				sources[ path ].layer === 'block' &&
				elementSources[ path ]?.layer === 'element'
		);
	} );
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
		<ScreenBody>
			<Stack direction="column" gap="sm">
				<Subtitle level={ 3 }>{ __( 'Applies to' ) }</Subtitle>
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
