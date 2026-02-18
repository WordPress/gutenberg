/**
 * WordPress dependencies
 */
// @ts-expect-error: Not typed yet.
import { getBlockType } from '@wordpress/blocks';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useContext, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	PanelBody,
	__experimentalVStack as VStack,
	__experimentalHasSplitBorders as hasSplitBorders,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	setStyle as setStyleHelper,
	setSetting as setSettingHelper,
} from '@wordpress/global-styles-engine';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import BlockPreviewPanel from './block-preview-panel';
import { Subtitle } from './subtitle';
import {
	useBlockVariations,
	VariationsPanel,
} from './variations/variations-panel';
import { useStyle, useSetting } from './hooks';
import { GlobalStylesContext } from './context';
import { unlock } from './lock-unlock';

// Initial control values.
const BACKGROUND_BLOCK_DEFAULT_VALUES = {
	backgroundSize: 'cover',
	backgroundPosition: '50% 50%', // used only when backgroundSize is 'contain'.
};

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
}

function ScreenBlock( { name, variation }: ScreenBlockProps ) {
	const { user: userConfig, onChange: onChangeGlobalStyles } =
		useContext( GlobalStylesContext );

	let prefixParts: string[] = [];
	if ( variation ) {
		prefixParts = [ 'variations', variation ].concat( prefixParts );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useStyle( prefix, name, 'user', false );
	const [ inheritedStyle, setStyle ] = useStyle(
		prefix,
		name,
		'merged',
		false
	);
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
	const hasImageSettingsPanel = useHasImageSettingsPanel(
		name,
		userSettings,
		settings
	);
	const hasVariationsPanel = !! blockVariations?.length && ! variation;
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
			let updatedConfig = setStyleHelper(
				userConfig,
				prefix,
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
	const onChangeBorders = ( newStyle: any ) => {
		if ( ! newStyle?.border ) {
			setStyle( newStyle );
			return;
		}

		// As Global Styles can't conditionally generate styles based on if
		// other style properties have been set, we need to force split
		// border definitions for user set global border styles. Border
		// radius is derived from the same property i.e. `border.radius` if
		// it is a string that is used. The longhand border radii styles are
		// only generated if that property is an object.
		//
		// For borders (color, style, and width) those are all properties on
		// the `border` style property. This means if the theme.json defined
		// split borders and the user condenses them into a flat border or
		// vice-versa we'd get both sets of styles which would conflict.
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
			<ScreenHeader
				title={
					variation ? currentBlockStyle?.label : blockType?.title
				}
			/>
			<BlockPreviewPanel name={ name } variation={ variation } />
			{ hasVariationsPanel && (
				<div className="global-styles-ui-screen-variations">
					<VStack spacing={ 3 }>
						<Subtitle>{ __( 'Style Variations' ) }</Subtitle>
						<VariationsPanel name={ name } />
					</VStack>
				</div>
			) }
			{ hasColorPanel && (
				<StylesColorPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
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
			{ hasTypographyPanel && (
				<StylesTypographyPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ onChangeTypography }
					settings={ settings }
					isGlobalStyles
				/>
			) }
			{ hasDimensionsPanel && (
				<StylesDimensionsPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ onChangeDimensions }
					settings={ settings }
					includeLayoutControls
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
			{ hasFiltersPanel && (
				<StylesFiltersPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ setStyle }
					settings={ settings }
					includeLayoutControls
				/>
			) }
			{ hasImageSettingsPanel && (
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
							blockType?.title
						) }
					/>
				</PanelBody>
			) }
		</>
	);
}

export default ScreenBlock;
