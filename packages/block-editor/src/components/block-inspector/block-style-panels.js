import { BackgroundImagePanel } from '../../hooks/background';
import { BorderPanel } from '../../hooks/border';
import { DimensionsPanel } from '../../hooks/dimensions';
import { ElementsEdit } from '../../hooks/elements';
import { TypographyPanel } from '../../hooks/typography';

export default function BlockStylePanels( {
	clientId,
	name,
	setAttributes,
	settings,
	panelWrappers = {},
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
