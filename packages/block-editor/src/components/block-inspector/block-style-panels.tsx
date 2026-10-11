import { useMemo } from '@wordpress/element';
import type { BlockEditProps } from '@wordpress/blocks';
import { BackgroundImagePanel } from '../../hooks/background';
import { BorderPanel } from '../../hooks/border';
import { DimensionsPanel } from '../../hooks/dimensions';
import { ElementsEdit } from '../../hooks/elements';
import { TypographyPanel } from '../../hooks/typography';
import type { useBlockSettings } from '../../hooks/utils';
import type { BackgroundToolsPanel } from '../global-styles/background-panel';
import type { BorderToolsPanel } from '../global-styles/border-panel';
import type { ColorToolsPanel } from '../global-styles/color-panel';
import type { DimensionsToolsPanel } from '../global-styles/dimensions-panel';
import type { TypographyToolsPanel } from '../global-styles/typography-panel';

const DEFAULT_PANELS = [
	'elements',
	'background',
	'typography',
	'border',
	'dimensions',
] as const;

export type BlockStylePanel = ( typeof DEFAULT_PANELS )[ number ];

export type BlockStylePanelsProps = {
	clientId: string;
	name: string;
	setAttributes: BlockEditProps[ 'setAttributes' ];
	settings: ReturnType< typeof useBlockSettings > & { typography?: object };
	panelWrappers?: {
		elements?: typeof ColorToolsPanel;
		background?: typeof BackgroundToolsPanel;
		typography?: typeof TypographyToolsPanel;
		border?: typeof BorderToolsPanel;
		dimensions?: typeof DimensionsToolsPanel;
	};
	panels?: readonly BlockStylePanel[];
};

export default function BlockStylePanels( {
	clientId,
	name,
	setAttributes,
	settings,
	panelWrappers = {},
	panels = DEFAULT_PANELS,
}: BlockStylePanelsProps ) {
	const panelSettings = useMemo(
		() => ( {
			...settings,
			typography: {
				...settings.typography,
				// The text alignment UI for individual blocks is rendered in
				// the block toolbar, so disable it here.
				textAlign: false,
			},
		} ),
		[ settings ]
	);

	const passedProps = {
		clientId,
		name,
		setAttributes,
		settings: panelSettings,
	};

	return (
		<>
			{ panels.includes( 'elements' ) && (
				<ElementsEdit
					{ ...passedProps }
					asWrapper={ panelWrappers.elements }
				/>
			) }
			{ panels.includes( 'background' ) && (
				<BackgroundImagePanel
					{ ...passedProps }
					asWrapper={ panelWrappers.background }
				/>
			) }
			{ panels.includes( 'typography' ) && (
				<TypographyPanel
					{ ...passedProps }
					asWrapper={ panelWrappers.typography }
				/>
			) }
			{ panels.includes( 'border' ) && (
				<BorderPanel
					{ ...passedProps }
					asWrapper={ panelWrappers.border }
				/>
			) }
			{ panels.includes( 'dimensions' ) && (
				<DimensionsPanel
					{ ...passedProps }
					asWrapper={ panelWrappers.dimensions }
				/>
			) }
		</>
	);
}
