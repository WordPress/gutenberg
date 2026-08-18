import { __ } from '@wordpress/i18n';
import type { GlobalStylesSettings } from '@wordpress/global-styles-engine';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import TypographyElements from './typography-elements';
import { ElementColors } from './element-colors';

const FORM_ELEMENTS = [
	{ element: 'label', label: __( 'Labels' ) },
	{ element: 'textInput', label: __( 'Inputs' ) },
	{ element: 'select', label: __( 'Selects' ) },
];

const COLOR_ELEMENTS = [
	{ name: 'label', label: __( 'Labels' ) },
	{ name: 'textInput', label: __( 'Inputs' ) },
	{ name: 'select', label: __( 'Selects' ) },
];

const DEFAULT_COLOR_CONTROLS = {
	link: false,
	heading: false,
	button: false,
	caption: false,
	label: true,
	textInput: true,
	select: true,
};

function getFormColorSettings( settings: GlobalStylesSettings ) {
	return {
		...settings,
		color: {
			...settings.color,
			link: false,
			heading: false,
			button: false,
			caption: false,
		},
	};
}

function ScreenForms() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Form controls' ) }
				description={ __(
					'Customize the typography and colors of labels, inputs, and selects.'
				) }
			/>
			<ScreenBody>
				<TypographyElements
					elements={ FORM_ELEMENTS }
					parentMenu="/elements/form-controls"
					title={ __( 'Typography' ) }
				/>
			</ScreenBody>
			<ElementColors
				additionalElements={ COLOR_ELEMENTS }
				defaultControls={ DEFAULT_COLOR_CONTROLS }
				settingsTransform={ getFormColorSettings }
				label={ __( 'Colors' ) }
			/>
		</>
	);
}

export default ScreenForms;
