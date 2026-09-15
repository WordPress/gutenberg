import { __, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalSpacer as Spacer,
	__experimentalHasSplitBorders as hasSplitBorders,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type {
	GlobalStylesConfig,
	GlobalStylesSettings,
	GlobalStylesStyles,
} from '@wordpress/global-styles-engine';
import { ScreenHeader } from './screen-header';
import ElementPreview from './element-preview';
import { useSetting, useStyle } from './hooks';
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

	const hasTypographyPanel = useHasTypographyPanel( settings );
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
