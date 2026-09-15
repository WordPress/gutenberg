import { getBlockType } from '@wordpress/blocks';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useContext, useMemo, useState } from '@wordpress/element';
import {
	PanelBody,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	setStyle as setStyleHelper,
	setSetting as setSettingHelper,
} from '@wordpress/global-styles-engine';
import { ScreenHeader } from './screen-header';
import BlockPreviewPanel from './block-preview-panel';
import { Subtitle } from './subtitle';
import {
	useBlockVariations,
	VariationsPanel,
} from './variations/variations-panel';
import {
	useStyle,
	useSetting,
	useStyleWithResolvedBackground,
	useCanEditCSS,
} from './hooks';
import { normalizeBorderStyle } from './border-utils';
import { GlobalStylesContext } from './context';
import { unlock } from './lock-unlock';
import { getValidPseudoStates, getValidViewportStates } from './utils';

// Initial control values.
const BACKGROUND_BLOCK_DEFAULT_VALUES = {
	backgroundSize: 'cover',
	backgroundPosition: '50% 50%', // used only when backgroundSize is 'contain'.
};

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useSettingsForBlockElement,
	useHasColorPanel,
	useHasFiltersPanel,
	useHasImageSettingsPanel,
	useHasBackgroundPanel,
	BackgroundPanel: StylesBackgroundPanel,
	BorderPanel: StylesBorderPanel,
	ColorPanel: StylesColorPanel,
	TypographyPanel: StylesTypographyPanel,
	DimensionsPanel: StylesDimensionsPanel,
	FiltersPanel: StylesFiltersPanel,
	ImageSettingsPanel,
	AdvancedPanel: StylesAdvancedPanel,
} = unlock( blockEditorPrivateApis );

interface ScreenBlockProps {
	name: string;
	variation?: string;
	selectedViewport?: string;
	showResponsiveStateControls?: boolean;
	showBlockStateControls?: boolean;
}

function ScreenBlock( {
	name,
	variation,
	selectedViewport: controlledSelectedViewport,
	showResponsiveStateControls = true,
	showBlockStateControls = true,
}: ScreenBlockProps ) {
	const {
		user: userConfig,
		merged: mergedConfig,
		onChange: onChangeGlobalStyles,
	} = useContext( GlobalStylesContext );

	let prefixParts: string[] = [];
	if ( variation ) {
		prefixParts = [ 'variations', variation ].concat( prefixParts );
	}
	const prefix = prefixParts.join( '.' );

	// State selector state
	const [ localSelectedViewport, setSelectedViewport ] =
		useState< string >( 'default' );
	const [ selectedPseudoState, setSelectedPseudoState ] =
		useState< string >( 'default' );
	const selectedViewport =
		controlledSelectedViewport ?? localSelectedViewport;
	const viewportSettings = mergedConfig.settings?.viewport;
	const validViewportStates = useMemo(
		() => getValidViewportStates( viewportSettings ),
		[ viewportSettings ]
	);
	const effectiveSelectedViewport =
		selectedViewport === 'default' ||
		validViewportStates.some(
			( state ) => state.value === selectedViewport
		)
			? selectedViewport
			: 'default';
	const validPseudoStates = useMemo(
		() => getValidPseudoStates( name ),
		[ name ]
	);

	const stateParam = [ effectiveSelectedViewport, selectedPseudoState ]
		.filter( ( value ) => value !== 'default' )
		.join( '.' );
	const hasSelectedState = stateParam.length > 0;
	const [ style, setStyle ] = useStyle(
		prefix,
		name,
		'user',
		false,
		hasSelectedState ? stateParam : undefined
	);
	const [ inheritedStyle ] = useStyle(
		prefix,
		name,
		'merged',
		false,
		hasSelectedState ? stateParam : undefined
	);
	const inheritedStyleWithResolvedBackground =
		useStyleWithResolvedBackground( inheritedStyle );

	const [ userSettings ] = useSetting( '', name, 'user' );
	const [ rawSettings, setSettings ] = useSetting( '', name );
	const settingsForBlockElement = useSettingsForBlockElement(
		rawSettings,
		name
	);
	const blockType = getBlockType( name );

	// Only allow `blockGap` support if serialization has not been skipped, to be sure global spacing can be applied.
	let disableBlockGap = false;
	if (
		settingsForBlockElement?.spacing?.blockGap &&
		blockType?.supports?.spacing?.blockGap &&
		( blockType?.supports?.spacing?.__experimentalSkipSerialization ===
			true ||
			blockType?.supports?.spacing?.__experimentalSkipSerialization?.some?.(
				( spacingType: string ) => spacingType === 'blockGap'
			) )
	) {
		disableBlockGap = true;
	}

	// Only allow `aspectRatio` support if the block is not the grouping block.
	// The grouping block allows the user to use Group, Row and Stack variations,
	// and it is highly likely that the user will not want to set an aspect ratio
	// for all three at once. Until there is the ability to set a different aspect
	// ratio for each variation, we disable the aspect ratio controls for the
	// grouping block in global styles.
	let disableAspectRatio = false;
	if (
		settingsForBlockElement?.dimensions?.aspectRatio &&
		name === 'core/group'
	) {
		disableAspectRatio = true;
	}

	const settings = useMemo( () => {
		const updatedSettings = structuredClone( settingsForBlockElement );
		if ( disableBlockGap ) {
			updatedSettings.spacing.blockGap = false;
		}
		if ( disableAspectRatio ) {
			updatedSettings.dimensions.aspectRatio = false;
		}
		return updatedSettings;
	}, [ settingsForBlockElement, disableBlockGap, disableAspectRatio ] );

	const blockVariations = useBlockVariations( name );
	const hasBackgroundPanel = useHasBackgroundPanel( settings );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasBorderPanel = useHasBorderPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasFiltersPanel = useHasFiltersPanel( settings );
	const shouldShowFiltersPanel =
		hasFiltersPanel && effectiveSelectedViewport === 'default';
	const hasImageSettingsPanel = useHasImageSettingsPanel(
		name,
		userSettings,
		settings
	);
	const hasVariationsPanel =
		!! blockVariations?.length && ! variation && ! hasSelectedState;
	const canEditCSS = useCanEditCSS();
	const currentBlockStyle = variation
		? blockVariations.find( ( s: any ) => s.name === variation )
		: null;

	// These intermediary objects are needed because the "layout" property is stored
	// in settings rather than styles.
	const inheritedStyleWithLayout = useMemo( () => {
		return {
			...inheritedStyle,
			layout: settings.layout,
		};
	}, [ inheritedStyle, settings.layout ] );
	const styleWithLayout = useMemo( () => {
		return {
			...style,
			layout: userSettings.layout,
		};
	}, [ style, userSettings.layout ] );
	const onChangeDimensions = ( newStyle: any ) => {
		const updatedStyle = { ...newStyle };
		delete updatedStyle.layout;
		setStyle( updatedStyle );

		if ( newStyle.layout !== userSettings.layout ) {
			setSettings( {
				...userSettings,
				layout: newStyle.layout,
			} );
		}
	};
	const onChangeLightbox = ( newSetting: any ) => {
		// If the newSetting is undefined, this means that the user has deselected
		// (reset) the lightbox setting.
		if ( newSetting === undefined ) {
			setSettings( {
				...rawSettings,
				lightbox: undefined,
			} );

			// Otherwise, we simply set the lightbox setting to the new value but
			// taking care of not overriding the other lightbox settings.
		} else {
			setSettings( {
				...rawSettings,
				lightbox: {
					...rawSettings.lightbox,
					...newSetting,
				},
			} );
		}
	};

	const onChangeTypography = ( newStyle: any ) => {
		// Extract settings if present (e.g., from textIndent toggle)
		const { settings: newSettings, ...styleWithoutSettings } = newStyle;

		// If there are settings changes, we need to update both styles and
		// settings atomically to avoid race conditions.
		if ( newSettings?.typography ) {
			// Build the state-aware path so that viewport styles (e.g. @mobile)
			// are written to the correct sub-path and do not overwrite the default.
			const stylePathForState = [ prefix, stateParam ]
				.filter( Boolean )
				.join( '.' );
			let updatedConfig = setStyleHelper(
				userConfig,
				stylePathForState,
				styleWithoutSettings,
				name
			);
			updatedConfig = setSettingHelper(
				updatedConfig,
				'typography',
				{
					...userSettings.typography,
					...newSettings.typography,
				},
				name
			);
			onChangeGlobalStyles( updatedConfig );
		} else {
			setStyle( styleWithoutSettings );
		}
	};
	const onChangeBorders = ( newStyle: any ) =>
		setStyle( normalizeBorderStyle( newStyle ) );

	return (
		<>
			<ScreenHeader
				title={
					variation ? currentBlockStyle?.label! : blockType?.title!
				}
				viewportStates={ validViewportStates }
				pseudoStates={ showBlockStateControls ? validPseudoStates : [] }
				selectedViewport={ effectiveSelectedViewport }
				selectedPseudoState={ selectedPseudoState }
				onChangeViewport={
					showResponsiveStateControls
						? setSelectedViewport
						: undefined
				}
				onChangePseudoState={ setSelectedPseudoState }
				showResponsiveStateControls={ showResponsiveStateControls }
			/>
			<BlockPreviewPanel
				name={ name }
				variation={ variation }
				selectedViewport={ effectiveSelectedViewport }
				selectedState={ hasSelectedState ? stateParam : 'default' }
				stateStyles={ hasSelectedState ? inheritedStyle : undefined }
				viewportSettings={ viewportSettings }
			/>
			{ hasVariationsPanel && (
				<div className="global-styles-ui-screen-variations">
					<VStack spacing={ 3 }>
						<Subtitle>{ __( 'Style Variations' ) }</Subtitle>
						<VariationsPanel name={ name } />
					</VStack>
				</div>
			) }
			{ hasTypographyPanel && (
				<StylesTypographyPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ onChangeTypography }
					settings={ settings }
					// Only expose global-settings controls (e.g. "Indent all
					// paragraphs") when not editing a state-specific variation,
					// because those settings are global and cannot be per-breakpoint.
					isGlobalStyles={ ! hasSelectedState }
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ hasBackgroundPanel && (
				<StylesBackgroundPanel
					inheritedValue={ inheritedStyleWithResolvedBackground }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
					defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ shouldShowFiltersPanel && (
				<StylesFiltersPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ setStyle }
					settings={ settings }
					includeLayoutControls
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ hasDimensionsPanel && (
				<StylesDimensionsPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ onChangeDimensions }
					settings={ settings }
					includeLayoutControls
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
			{ hasColorPanel && (
				<StylesColorPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
					showInheritanceLabelIndicators={ false }
				/>
			) }
			{ hasImageSettingsPanel && ! hasSelectedState && (
				<ImageSettingsPanel
					onChange={ onChangeLightbox }
					value={ userSettings }
					inheritedValue={ settings }
				/>
			) }

			{ canEditCSS && (
				<PanelBody title={ __( 'Advanced' ) } initialOpen={ false }>
					<StylesAdvancedPanel
						value={ style }
						onChange={ setStyle }
						inheritedValue={ inheritedStyle }
						help={ sprintf(
							// translators: %s: is the name of a block e.g., 'Image' or 'Table'.
							__(
								'Add your own CSS to customize the appearance of the %s block. You do not need to include a CSS selector, just add the property and value.'
							),
							blockType?.title!
						) }
					/>
				</PanelBody>
			) }
		</>
	);
}

export default ScreenBlock;
