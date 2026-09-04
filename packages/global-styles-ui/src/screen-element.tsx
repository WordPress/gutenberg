import { __, _x, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalSpacer as Spacer,
	__experimentalHasSplitBorders as hasSplitBorders,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type {
	GlobalStylesConfig,
	GlobalStylesSettings,
	GlobalStylesStyles,
} from '@wordpress/global-styles-engine';
import { ElementColors } from './element-colors';
import TypographyPanel from './typography-panel';
import { ScreenHeader } from './screen-header';
import TypographyPreview from './typography-preview';
import { useSetting, useStyle } from './hooks';
import { unlock } from './lock-unlock';

const {
	useSettingsForBlockElement,
	useHasBackgroundPanel,
	useHasBorderPanel,
	useHasDimensionsPanel,
	BackgroundPanel: StylesBackgroundPanel,
	BorderPanel: StylesBorderPanel,
	DimensionsPanel: StylesDimensionsPanel,
	AdvancedPanel: StylesAdvancedPanel,
} = unlock( blockEditorPrivateApis );

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
		description: __( 'Manage the appearance of buttons.' ),
		title: __( 'Buttons' ),
	},
	textInput: {
		description: __( 'Manage the appearance of inputs.' ),
		title: __( 'Inputs' ),
	},
	select: {
		description: __( 'Manage the appearance of selects.' ),
		title: __( 'Selects' ),
	},
};

type ElementName = keyof typeof elements;

interface ScreenElementProps {
	element: ElementName;
	showColorControls?: boolean;
}

const ADDITIONAL_COLOR_ELEMENTS = [ 'cite', 'textInput', 'select' ];

function applyFallbackStyle( border: any ) {
	if ( ! border ) {
		return border;
	}

	const hasColorOrWidth = border.color || border.width;

	if ( ! border.style && hasColorOrWidth ) {
		return { ...border, style: 'solid' };
	}

	if ( border.style && ! hasColorOrWidth ) {
		return undefined;
	}

	return border;
}

function applyAllFallbackStyles( border: any ) {
	if ( ! border ) {
		return border;
	}

	if ( hasSplitBorders( border ) ) {
		return {
			top: applyFallbackStyle( border.top ),
			right: applyFallbackStyle( border.right ),
			bottom: applyFallbackStyle( border.bottom ),
			left: applyFallbackStyle( border.left ),
		};
	}

	return applyFallbackStyle( border );
}

function getColorSettingsForElement(
	settings: GlobalStylesSettings,
	element: ElementName
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

/**
 * Renders the style panels that read and write `styles.elements.<name>`
 * directly. Typography and color are handled separately because they are
 * scoped differently: color controls for an element are exposed through the
 * root color panel.
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
	const prefix = `elements.${ element }`;
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

	const hasBackgroundPanel = useHasBackgroundPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasBorderPanel = useHasBorderPanel( settings );

	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS: !! ( globalStyles as GlobalStylesConfig )?._links?.[
				'wp:action-edit-css'
			],
		};
	}, [] );

	// Global Styles cannot generate a border declaration conditionally on
	// whether a sibling property is set, so split and flat border definitions
	// have to be reconciled before they are stored. Mirrors the block screen.
	const onChangeBorders = ( newStyle: any ) => {
		if ( ! newStyle?.border ) {
			setStyle( newStyle );
			return;
		}

		const { radius, ...newBorder } = newStyle.border;
		const border = applyAllFallbackStyles( newBorder );
		const updatedBorder = ! hasSplitBorders( border )
			? {
					top: border,
					right: border,
					bottom: border,
					left: border,
			  }
			: {
					color: null,
					style: null,
					width: null,
					...border,
			  };

		setStyle( { ...newStyle, border: { ...updatedBorder, radius } } );
	};

	return (
		<>
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
			{ canEditCSS && (
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

function ScreenElement( {
	element,
	showColorControls = true,
}: ScreenElementProps ) {
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
	const usedElement = element === 'heading' ? headingLevel : element;

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
			{ /*
			   "Text" is the root rather than an element, so there is no
			   `styles.elements.text` node for these panels to write into.
			*/ }
			{ element !== 'text' && (
				<ElementStylePanels
					key={ usedElement }
					element={ usedElement }
					label={ elements[ element ].title }
				/>
			) }
		</>
	);
}

export default ScreenElement;
