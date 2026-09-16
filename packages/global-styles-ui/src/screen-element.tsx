import { __, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type {
	GlobalStylesSettings,
	GlobalStylesStyles,
} from '@wordpress/global-styles-engine';
import { ScreenHeader } from './screen-header';
import ElementPreview from './element-preview';
import { useSetting, useStyle, useCanEditCSS } from './hooks';
import { normalizeBorderStyle } from './border-utils';
import { unlock } from './lock-unlock';

const {
	useSettingsForBlockElement,
	useHasBackgroundPanel,
	useHasBorderPanel,
	useHasDimensionsPanel,
	useHasTypographyPanel,
	BackgroundPanel: StylesBackgroundPanel,
	BorderPanel: StylesBorderPanel,
	DimensionsPanel: StylesDimensionsPanel,
	TypographyPanel: StylesTypographyPanel,
	AdvancedPanel: StylesAdvancedPanel,
} = unlock( blockEditorPrivateApis );

const elements = {
	text: {
		description: __( 'Manage the fonts used on the site.' ),
		title: __( 'Text' ),
	},
	link: {
		description: __( 'Manage the appearance of links.' ),
		title: __( 'Link' ),
	},
	caption: {
		description: __( 'Manage the appearance of captions.' ),
		title: __( 'Caption' ),
	},
	cite: {
		description: __( 'Manage the appearance of citations.' ),
		title: __( 'Citation' ),
	},
	heading: {
		description: __( 'Manage the appearance of all headings.' ),
		title: __( 'All headings' ),
	},
	h1: {
		description: __( 'Manage the appearance of level 1 headings.' ),
		title: __( 'Heading 1' ),
	},
	h2: {
		description: __( 'Manage the appearance of level 2 headings.' ),
		title: __( 'Heading 2' ),
	},
	h3: {
		description: __( 'Manage the appearance of level 3 headings.' ),
		title: __( 'Heading 3' ),
	},
	h4: {
		description: __( 'Manage the appearance of level 4 headings.' ),
		title: __( 'Heading 4' ),
	},
	h5: {
		description: __( 'Manage the appearance of level 5 headings.' ),
		title: __( 'Heading 5' ),
	},
	h6: {
		description: __( 'Manage the appearance of level 6 headings.' ),
		title: __( 'Heading 6' ),
	},
	textInput: {
		description: __( 'Manage the appearance of inputs.' ),
		title: __( 'Input' ),
	},
	select: {
		description: __( 'Manage the appearance of selects.' ),
		title: __( 'Select' ),
	},
	button: {
		description: __( 'Manage the appearance of buttons.' ),
		title: __( 'Button' ),
	},
};

type ElementName = keyof typeof elements;

interface ScreenElementProps {
	element: ElementName;
}

/**
 * Renders every style panel for an element. The element's styles and settings
 * are resolved once here and shared by all the panels.
 *
 * @param props
 * @param props.element The element being styled.
 * @param props.label   Its display name, used in the custom CSS help text.
 */
function ElementStylePanels( {
	element,
	label,
}: {
	element: string;
	label: string;
} ) {
	// "Text" is the site's base text, stored at the root of the styles rather
	// than under `elements`. The root has its own screens for background,
	// spacing and borders, so only typography is offered here.
	const isRoot = element === 'text';
	const prefix = isRoot ? '' : `elements.${ element }`;
	const [ style ] = useStyle< GlobalStylesStyles >(
		prefix,
		'',
		'user',
		false
	);
	const [ inheritedStyle, setStyle ] = useStyle< GlobalStylesStyles >(
		prefix,
		'',
		'merged',
		false
	);
	const [ rawSettings ] = useSetting< GlobalStylesSettings >( '' );
	const settings = useSettingsForBlockElement(
		rawSettings,
		undefined,
		element
	);

	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasBackgroundPanel = useHasBackgroundPanel( settings ) && ! isRoot;
	const hasDimensionsPanel = useHasDimensionsPanel( settings ) && ! isRoot;
	const hasBorderPanel = useHasBorderPanel( settings ) && ! isRoot;

	const canEditCSS = useCanEditCSS();
	const onChangeBorders = ( newStyle: any ) =>
		setStyle( normalizeBorderStyle( newStyle ) );

	return (
		<>
			{ hasTypographyPanel && (
				<StylesTypographyPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ hasBackgroundPanel && (
				<StylesBackgroundPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ hasDimensionsPanel && (
				<StylesDimensionsPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ hasBorderPanel && (
				<StylesBorderPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ onChangeBorders }
					settings={ settings }
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ canEditCSS && ! isRoot && (
				<PanelBody title={ __( 'Advanced' ) } initialOpen={ false }>
					<StylesAdvancedPanel
						value={ style }
						onChange={ setStyle }
						inheritedValue={ inheritedStyle }
						help={ sprintf(
							// translators: %s: the name of an element e.g., 'Buttons' or 'Inputs'.
							__(
								'Add your own CSS to customize the appearance of %s. You do not need to include a CSS selector, just add the property and value.'
							),
							label
						) }
					/>
				</PanelBody>
			) }
		</>
	);
}

function ScreenElement( { element }: ScreenElementProps ) {
	return (
		<>
			<ScreenHeader
				title={ elements[ element ].title }
				description={ elements[ element ].description }
			/>
			<Spacer marginX={ 4 }>
				<ElementPreview element={ element } />
			</Spacer>
			<ElementStylePanels
				element={ element }
				label={ elements[ element ].title }
			/>
		</>
	);
}

export default ScreenElement;
