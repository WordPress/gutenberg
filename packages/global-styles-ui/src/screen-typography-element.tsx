import { __, _x } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import type { GlobalStylesSettings } from '@wordpress/global-styles-engine';
import { ElementColors } from './element-colors';
import TypographyPanel from './typography-panel';
import { ScreenHeader } from './screen-header';
import TypographyPreview from './typography-preview';

const elements = {
	text: {
		description: __( 'Manage the fonts used on the site.' ),
		title: __( 'Text' ),
	},
	link: {
		description: __( 'Manage the fonts and typography used on the links.' ),
		title: __( 'Links' ),
	},
	heading: {
		description: __( 'Manage the fonts and typography used on headings.' ),
		title: __( 'Headings' ),
	},
	caption: {
		description: __( 'Manage the fonts and typography used on captions.' ),
		title: __( 'Captions' ),
	},
	cite: {
		description: __( 'Manage the fonts and typography used on citations.' ),
		title: __( 'Citations' ),
	},
	button: {
		description: __( 'Manage the fonts and typography used on buttons.' ),
		title: __( 'Buttons' ),
	},
	textInput: {
		description: __( 'Manage the fonts and typography used on inputs.' ),
		title: __( 'Inputs' ),
	},
	select: {
		description: __( 'Manage the fonts and typography used on selects.' ),
		title: __( 'Selects' ),
	},
};

interface ScreenTypographyElementProps {
	element: keyof typeof elements;
	showColorControls?: boolean;
}

const ADDITIONAL_COLOR_ELEMENTS = [ 'cite', 'textInput', 'select' ];

function getColorSettingsForElement(
	settings: GlobalStylesSettings,
	element: keyof typeof elements
) {
	const colorSettings = settings.color as typeof settings.color & {
		heading?: boolean;
		button?: boolean;
		caption?: boolean;
	};

	return {
		...settings,
		color: {
			...colorSettings,
			link: element === 'link' && colorSettings?.link,
			heading: element === 'heading' && colorSettings?.heading,
			button: element === 'button' && colorSettings?.button,
			caption: element === 'caption' && colorSettings?.caption,
		},
	};
}

function ScreenTypographyElement( {
	element,
	showColorControls = true,
}: ScreenTypographyElementProps ) {
	const [ headingLevel, setHeadingLevel ] = useState( 'heading' );
	const hasColorPanel = showColorControls && element !== 'text';
	const additionalElements = ADDITIONAL_COLOR_ELEMENTS.includes( element )
		? [ { name: element, label: elements[ element ].title } ]
		: [];
	const defaultColorControls = {
		link: element === 'link',
		heading: element === 'heading',
		button: element === 'button',
		caption: element === 'caption',
		cite: element === 'cite',
		textInput: element === 'textInput',
		select: element === 'select',
	};

	return (
		<>
			<ScreenHeader
				title={ elements[ element ].title }
				description={ elements[ element ].description }
			/>
			<Spacer marginX={ 4 }>
				<TypographyPreview
					element={ element }
					headingLevel={ headingLevel }
				/>
			</Spacer>
			{ element === 'heading' && (
				<Spacer marginX={ 4 } marginBottom="1em">
					<ToggleGroupControl
						label={ __( 'Select heading level' ) }
						hideLabelFromVision
						value={ headingLevel }
						onChange={ ( value ) =>
							setHeadingLevel( value as string )
						}
						isBlock
					>
						<ToggleGroupControlOption
							value="heading"
							showTooltip
							aria-label={ __( 'All headings' ) }
							label={ _x( 'All', 'heading levels' ) }
						/>
						<ToggleGroupControlOption
							value="h1"
							showTooltip
							aria-label={ __( 'Heading 1' ) }
							label={ __( 'H1' ) }
						/>
						<ToggleGroupControlOption
							value="h2"
							showTooltip
							aria-label={ __( 'Heading 2' ) }
							label={ __( 'H2' ) }
						/>
						<ToggleGroupControlOption
							value="h3"
							showTooltip
							aria-label={ __( 'Heading 3' ) }
							label={ __( 'H3' ) }
						/>
						<ToggleGroupControlOption
							value="h4"
							showTooltip
							aria-label={ __( 'Heading 4' ) }
							label={ __( 'H4' ) }
						/>
						<ToggleGroupControlOption
							value="h5"
							showTooltip
							aria-label={ __( 'Heading 5' ) }
							label={ __( 'H5' ) }
						/>
						<ToggleGroupControlOption
							value="h6"
							showTooltip
							aria-label={ __( 'Heading 6' ) }
							label={ __( 'H6' ) }
						/>
					</ToggleGroupControl>
				</Spacer>
			) }
			<TypographyPanel
				element={ element }
				headingLevel={ headingLevel }
				showTextColor={ element === 'text' || ! hasColorPanel }
			/>
			{ hasColorPanel && (
				<ElementColors
					additionalElements={ additionalElements }
					defaultControls={ defaultColorControls }
					settingsTransform={ ( settings ) =>
						getColorSettingsForElement( settings, element )
					}
					label={ __( 'Colors' ) }
				/>
			) }
		</>
	);
}

export default ScreenTypographyElement;
