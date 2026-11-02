import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { PanelBody, useNavigator } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type {
	GlobalStylesSettings,
	GlobalStylesStyles,
} from '@wordpress/global-styles-engine';
import { ScreenHeader } from './screen-header';
import ElementPreview from './element-preview';
import ElementBlockOverrides from './element-block-overrides';
import { useSetting, useStyle, useCanEditCSS } from './hooks';
import { unlock } from './lock-unlock';
import { getValidPseudoStates } from './utils';
// Elements store borders and show background image defaults the same way as
// blocks, so they share the block screen's handling.
import {
	BACKGROUND_BLOCK_DEFAULT_VALUES,
	normalizeBorderStyle,
} from './screen-block';

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
	getBlockTypesForElement,
	getContrastWarning,
} = unlock( blockEditorPrivateApis );

/*
 * The elements that have their own screen. Their titles double as their labels
 * in the Blocks & Elements list, so the two always match.
 */
export const ELEMENTS = {
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
		title: __( 'Form input' ),
	},
	select: {
		description: __( 'Manage the appearance of selects.' ),
		title: __( 'Form select' ),
	},
	button: {
		description: __( 'Manage the appearance of buttons.' ),
		title: __( 'Form button' ),
	},
};

export type ElementName = keyof typeof ELEMENTS;

/**
 * Returns a warning when the site's text color has poor contrast against its
 * background color, or `undefined` when contrast is sufficient.
 *
 * Unlike the block editor, there is no rendered element to measure here, so
 * the colors are read from the merged styles. A gradient or image background
 * can't be checked from those values, so no warning is given for one.
 *
 * @param enabled Whether to check contrast.
 *
 * @return The warning message, if any.
 */
export function useTextContrastWarning( enabled: boolean ) {
	const [ textColor ] = useStyle< string >( 'color.text' );
	const [ backgroundColor ] = useStyle< string >( 'color.background' );
	const [ gradient ] = useStyle< string >( 'color.gradient' );
	const [ backgroundImage ] = useStyle< unknown >(
		'background.backgroundImage'
	);

	const warning =
		enabled && ! gradient && ! backgroundImage
			? getContrastWarning( {
					backgroundColor,
					textColor,
					// Same copy as the block editor's text color warning.
					messageOverride: __(
						'This color has poor contrast against the background. Consider increasing contrast.'
					),
					enableAlphaChecker: true,
				} )
			: null;

	// The notice that displays the warning is muted, so announce it here, and
	// only when the message appears or changes.
	const speakMessage = warning?.speakMessage;
	useEffect( () => {
		if ( speakMessage ) {
			speak( speakMessage );
		}
	}, [ speakMessage ] );

	return warning?.message;
}

interface ScreenElementProps {
	/**
	 * The element to style. Read from the `:element` path parameter when not
	 * given, which is how the elements in the block list open.
	 */
	element?: ElementName;
	/**
	 * Whether to offer the element's states, such as hover. Follows the same
	 * editor setting that turns off state editing for blocks.
	 */
	showStateControls?: boolean;
}

/**
 * Renders every style panel for an element. The element's settings are
 * resolved once here and shared by all the panels, as are the styles that the
 * screen resolves for them.
 *
 * @param props
 * @param props.element        The element being styled.
 * @param props.label          Its display name, used in the custom CSS help text.
 * @param props.style          The element's user styles in the selected state.
 * @param props.inheritedStyle The element's merged styles in the selected state.
 * @param props.setStyle       Saves the element's user styles in the selected state.
 */
function ElementStylePanels( {
	element,
	label,
	style,
	inheritedStyle,
	setStyle,
}: {
	element: string;
	label: string;
	style?: GlobalStylesStyles;
	inheritedStyle?: GlobalStylesStyles;
	setStyle: ( newStyle?: GlobalStylesStyles ) => void;
} ) {
	// The root has its own screens for background, spacing and borders, so
	// only typography is offered for "Text".
	const isRoot = element === 'text';
	const [ rawSettings ] = useSetting< GlobalStylesSettings >( '' );
	const settings = useSettingsForBlockElement(
		rawSettings,
		undefined,
		element
	);

	const contrastWarning = useTextContrastWarning( isRoot );

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
					contrastWarning={ contrastWarning }
				/>
			) }
			{ hasBackgroundPanel && (
				<StylesBackgroundPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
					defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
				/>
			) }
			{ hasDimensionsPanel && (
				<StylesDimensionsPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
				/>
			) }
			{ hasBorderPanel && (
				<StylesBorderPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ onChangeBorders }
					settings={ settings }
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

function ScreenElement( {
	element: elementProp,
	showStateControls = true,
}: ScreenElementProps ) {
	const { params } = useNavigator();
	const element = ( elementProp ?? params.element ) as ElementName;
	const [ selectedPseudoState, setSelectedPseudoState ] =
		useState< string >( 'default' );
	// Only links and buttons have states, such as hover and focus.
	const pseudoStates = useMemo(
		() => ( showStateControls ? getValidPseudoStates( element ) : [] ),
		[ element, showStateControls ]
	);
	const allBlockTypes = useSelect(
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);
	const elementBlockTypes = useMemo(
		() =>
			getBlockTypesForElement( element )
				.map( ( name: string ) =>
					allBlockTypes.find(
						( blockType ) => blockType.name === name
					)
				)
				.filter(
					(
						blockType: BlockType | undefined
					): blockType is BlockType => !! blockType
				),
		[ element, allBlockTypes ]
	);
	const state =
		selectedPseudoState === 'default' ? undefined : selectedPseudoState;
	// "Text" is the site's base text, stored at the root of the styles rather
	// than under `elements`. Its styles are resolved once here and shared by
	// the preview and the style panels.
	const prefix = element === 'text' ? '' : `elements.${ element }`;
	const [ style ] = useStyle< GlobalStylesStyles >(
		prefix,
		'',
		'user',
		false,
		state
	);
	const [ inheritedStyle, setStyle ] = useStyle< GlobalStylesStyles >(
		prefix,
		'',
		'merged',
		false,
		state
	);

	if ( ! Object.hasOwn( ELEMENTS, element ) ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ ELEMENTS[ element ].title }
				description={ ELEMENTS[ element ].description }
				pseudoStates={ pseudoStates }
				selectedPseudoState={ selectedPseudoState }
				onChangePseudoState={ setSelectedPseudoState }
			/>
			<ElementPreview
				element={ element }
				state={ state }
				stateStyles={ state ? inheritedStyle : undefined }
			/>
			<ElementStylePanels
				element={ element }
				label={ ELEMENTS[ element ].title }
				style={ style }
				inheritedStyle={ inheritedStyle }
				setStyle={ setStyle }
			/>
			<ElementBlockOverrides
				element={ element }
				blockTypes={ elementBlockTypes }
			/>
		</>
	);
}

export default ScreenElement;
