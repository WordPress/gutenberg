import { BackgroundImagePanel } from '../../hooks/background';
import { BorderPanel } from '../../hooks/border';
import { DimensionsPanel } from '../../hooks/dimensions';
import { ElementsEdit } from '../../hooks/elements';
import { TypographyPanel } from '../../hooks/typography';

const DEFAULT_PANELS = [
	'elements',
	'background',
	'typography',
	'border',
	'dimensions',
];

const PANEL_COMPONENTS = {
	elements: ElementsEdit,
	background: BackgroundImagePanel,
	typography: TypographyPanel,
	border: BorderPanel,
	dimensions: DimensionsPanel,
};

function getPanelProps( { clientId, name, setAttributes, settings } ) {
	return {
		clientId,
		name,
		setAttributes,
		settings: {
			...settings,
			typography: {
				...settings.typography,
				// The text alignment UI for individual blocks is rendered in
				// the block toolbar, so disable it here.
				textAlign: false,
			},
		},
	};
}

export default function BlockStylePanels( {
	clientId,
	name,
	setAttributes,
	settings,
	panelWrappers = {},
} ) {
	const passedProps = getPanelProps( {
		clientId,
		name,
		setAttributes,
		settings,
	} );

	return (
		<>
			<ElementsEdit
				{ ...passedProps }
				asWrapper={ panelWrappers.elements }
			/>
			<BackgroundImagePanel
				{ ...passedProps }
				asWrapper={ panelWrappers.background }
			/>
			<TypographyPanel
				{ ...passedProps }
				asWrapper={ panelWrappers.typography }
			/>
			<BorderPanel
				{ ...passedProps }
				asWrapper={ panelWrappers.border }
			/>
			<DimensionsPanel
				{ ...passedProps }
				asWrapper={ panelWrappers.dimensions }
			/>
		</>
	);
}

// Keep the normal block-support panels unconditional so their inspector fills
// always register. Only mixed text selections use this filtered renderer.
export function BlockStylePanelsSubset( {
	clientId,
	name,
	setAttributes,
	settings,
	panelWrappers = {},
	panels = DEFAULT_PANELS,
} ) {
	const passedProps = getPanelProps( {
		clientId,
		name,
		setAttributes,
		settings,
	} );

	return (
		<>
			{ panels.map( ( panel ) => {
				const Panel = PANEL_COMPONENTS[ panel ];

				return (
					<Panel
						key={ panel }
						{ ...passedProps }
						asWrapper={ panelWrappers[ panel ] }
					/>
				);
			} ) }
		</>
	);
}
