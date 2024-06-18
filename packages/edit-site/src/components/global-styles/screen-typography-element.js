/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import ScreenHeader from './header';
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
	button: {
		description: __( 'Manage the fonts and typography used on buttons.' ),
		title: __( 'Buttons' ),
	},
};

function ScreenTypographyElement( { element } ) {
	const [ headingLevel, setHeadingLevel ] = useState( 'heading' );

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
						onChange={ setHeadingLevel }
						isBlock
						size="__unstable-large"
						__nextHasNoMarginBottom
					>
						<ToggleGroupControlOption
							value="heading"
							label={ _x( 'All', 'heading levels' ) }
						/>
						<ToggleGroupControlOption
							value="h1"
							label={ __( 'H1' ) }
						/>
						<ToggleGroupControlOption
							value="h2"
							label={ __( 'H2' ) }
						/>
						<ToggleGroupControlOption
							value="h3"
							label={ __( 'H3' ) }
						/>
						<ToggleGroupControlOption
							value="h4"
							label={ __( 'H4' ) }
						/>
						<ToggleGroupControlOption
							value="h5"
							label={ __( 'H5' ) }
						/>
						<ToggleGroupControlOption
							value="h6"
							label={ __( 'H6' ) }
						/>
					</ToggleGroupControl>
				</Spacer>
			) }
			<TypographyPanel
				element={ element }
				headingLevel={ headingLevel }
			/>
		</>
	);
}

export default ScreenTypographyElement;
