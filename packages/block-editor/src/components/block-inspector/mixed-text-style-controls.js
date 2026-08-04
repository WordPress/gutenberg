import { store as blocksStore } from '@wordpress/blocks';
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	BlockEditContextProvider,
	blockEditingModeKey,
} from '../block-edit/context';
import { BlockStylePanelsSubset } from './block-style-panels';
import {
	BLOCK_STYLE_SETTINGS_PATHS,
	useBlockSettings,
} from '../../hooks/utils';
import { TypographyToolsPanel } from '../global-styles/typography-panel';
import { BackgroundToolsPanel } from '../global-styles/background-panel';
import { ColorToolsPanel } from '../global-styles/color-panel';
import { DimensionsToolsPanel } from '../global-styles/dimensions-panel';
import { BorderToolsPanel } from '../global-styles/border-panel';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	applySharedStyleAttributeChanges,
	createBlockStyleSettings,
	getCommonStyleSettings,
	getCommonSupportedStyles,
	getSharedStyleAttributeChanges,
	getSharedStylePaths,
	getSharedStyleSettings,
	getTextStyleTargetClientIds,
} from './mixed-text-style-utils';

const PANEL_WRAPPERS = {
	background: BackgroundToolsPanel,
	border: BorderToolsPanel,
	dimensions: DimensionsToolsPanel,
	elements: ColorToolsPanel,
	typography: TypographyToolsPanel,
};

export const SECTION_TEXT_STYLE_PANELS = [
	'typography',
	'border',
	'dimensions',
];

function MixedTextStylePanels( {
	blockTypes,
	clientIds,
	commonSupportedStyles,
	panels,
	settingsByTarget,
	sourceClientId,
	sourceName,
} ) {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const sourceSettings = useBlockSettings( sourceName );
	const commonSettings = useMemo(
		() => getCommonStyleSettings( sourceSettings, settingsByTarget ),
		[ sourceSettings, settingsByTarget ]
	);
	const settings = useMemo(
		() =>
			getSharedStyleSettings(
				commonSettings,
				commonSupportedStyles,
				blockTypes
			),
		[ commonSettings, commonSupportedStyles, blockTypes ]
	);
	const { stylePaths, attributeNames } = useMemo(
		() => getSharedStylePaths( commonSupportedStyles, blockTypes ),
		[ commonSupportedStyles, blockTypes ]
	);

	const setAttributes = useCallback(
		( nextAttributes ) => {
			const blockEditorSelect = registry.select( blockEditorStore );
			const sourceAttributes =
				blockEditorSelect.getBlockAttributes( sourceClientId );

			if ( ! sourceAttributes ) {
				return;
			}

			const sourceAttributePatch =
				typeof nextAttributes === 'function'
					? nextAttributes( sourceAttributes )
					: nextAttributes;
			const changes = getSharedStyleAttributeChanges(
				sourceAttributes,
				{ ...sourceAttributes, ...sourceAttributePatch },
				stylePaths,
				attributeNames
			);

			if (
				! changes.styleChanges.length &&
				! Object.keys( changes.attributeChanges ).length
			) {
				return;
			}

			const liveClientIds = clientIds.filter( ( clientId ) =>
				blockEditorSelect.getBlockAttributes( clientId )
			);
			if ( ! liveClientIds.length ) {
				return;
			}

			const attributePatches = Object.fromEntries(
				liveClientIds.map( ( clientId ) => [
					clientId,
					applySharedStyleAttributeChanges(
						blockEditorSelect.getBlockAttributes( clientId ),
						changes
					),
				] )
			);

			updateBlockAttributes( liveClientIds, attributePatches, true );
		},
		[
			attributeNames,
			clientIds,
			registry,
			sourceClientId,
			stylePaths,
			updateBlockAttributes,
		]
	);

	return (
		<BlockStylePanelsSubset
			clientId={ sourceClientId }
			name={ sourceName }
			panels={ panels }
			panelWrappers={ PANEL_WRAPPERS }
			setAttributes={ setAttributes }
			settings={ settings }
		/>
	);
}

export default function MixedTextStyleControls( { clientIds, panels } ) {
	const {
		blockTypes,
		commonSupportedStyles,
		settingsByTarget,
		sourceClientId,
		sourceName,
		targetClientIds,
	} = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );
			const blocksSelect = select( blocksStore );
			const targetIds = getTextStyleTargetClientIds(
				clientIds,
				blockEditorSelect.getBlockName,
				blocksSelect.getBlockType
			);
			const blockNames = targetIds.map( ( clientId ) =>
				blockEditorSelect.getBlockName( clientId )
			);
			const types = blockNames.map( ( blockName ) =>
				blocksSelect.getBlockType( blockName )
			);
			const { getSupportedStyles } = unlock( blocksSelect );
			const { getBlockSettings } = unlock( blockEditorSelect );
			const supportedStylesByBlock = blockNames.map( ( blockName ) =>
				getSupportedStyles( blockName )
			);

			return {
				blockTypes: types,
				commonSupportedStyles: getCommonSupportedStyles(
					supportedStylesByBlock
				),
				settingsByTarget: targetIds.map( ( clientId ) =>
					createBlockStyleSettings(
						BLOCK_STYLE_SETTINGS_PATHS,
						getBlockSettings(
							clientId,
							...BLOCK_STYLE_SETTINGS_PATHS
						)
					)
				),
				sourceClientId: targetIds[ 0 ],
				sourceName: blockNames[ 0 ],
				targetClientIds: targetIds,
			};
		},
		[ clientIds ]
	);

	const blockEditContext = useMemo(
		() => ( {
			clientId: sourceClientId,
			isSelected: true,
			name: sourceName,
			[ blockEditingModeKey ]: 'default',
		} ),
		[ sourceClientId, sourceName ]
	);

	if ( ! sourceClientId ) {
		return null;
	}

	return (
		<BlockEditContextProvider value={ blockEditContext }>
			<MixedTextStylePanels
				blockTypes={ blockTypes }
				clientIds={ targetClientIds }
				commonSupportedStyles={ commonSupportedStyles }
				panels={ panels }
				settingsByTarget={ settingsByTarget }
				sourceClientId={ sourceClientId }
				sourceName={ sourceName }
			/>
		</BlockEditContextProvider>
	);
}
