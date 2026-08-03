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

export default function BlockStylePanels( {
	clientId,
	name,
	setAttributes,
	settings,
	panelWrappers = {},
	panels = DEFAULT_PANELS,
} ) {
	const panelSettings = {
		...settings,
		typography: {
			...settings.typography,
			// The text alignment UI for individual blocks is rendered in
			// the block toolbar, so disable it here.
			textAlign: false,
		},
	};

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
