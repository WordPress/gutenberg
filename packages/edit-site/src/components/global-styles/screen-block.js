/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	PanelBody,
	__experimentalVStack as VStack,
	__experimentalHasSplitBorders as hasSplitBorders,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';
import { useBlockVariations, VariationsPanel } from './variations-panel';

function applyFallbackStyle( border ) {
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

function applyAllFallbackStyles( border ) {
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
	__experimentalUseHasBehaviorsPanel,
	useGlobalSetting,
	useSettingsForBlockElement,
	useHasColorPanel,
	useHasEffectsPanel,
	useHasFiltersPanel,
	useGlobalStyle,
	__experimentalUseGlobalBehaviors,
	__experimentalBehaviorsPanel: StylesBehaviorsPanel,
	BorderPanel: StylesBorderPanel,
	ColorPanel: StylesColorPanel,
	TypographyPanel: StylesTypographyPanel,
	DimensionsPanel: StylesDimensionsPanel,
	EffectsPanel: StylesEffectsPanel,
	FiltersPanel: StylesFiltersPanel,
	AdvancedPanel: StylesAdvancedPanel,
} = unlock( blockEditorPrivateApis );

function ScreenBlock( { name, variation } ) {
	let prefixParts = [];
	if ( variation ) {
		prefixParts = [ 'variations', variation ].concat( prefixParts );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useGlobalStyle( prefix, name, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( prefix, name, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ rawSettings, setSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );
	const [ behaviors, setBehaviors ] = __experimentalUseGlobalBehaviors(
		'',
		name
	);
	const blockType = getBlockType( name );
	const blockVariations = useBlockVariations( name );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasBehaviorsPanel = __experimentalUseHasBehaviorsPanel( name );
	const hasBorderPanel = useHasBorderPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasEffectsPanel = useHasEffectsPanel( settings );
	const hasFiltersPanel = useHasFiltersPanel( settings );
	const hasVariationsPanel = !! blockVariations?.length && ! variation;
	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS:
				!! globalStyles?._links?.[ 'wp:action-edit-css' ] ?? false,
		};
	}, [] );
	const currentBlockStyle = variation
		? blockVariations.find( ( s ) => s.name === variation )
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
			layout: settings.layout,
		};
	}, [ style, settings.layout ] );
	const onChangeDimensions = ( newStyle ) => {
		const updatedStyle = { ...newStyle };
		delete updatedStyle.layout;
		setStyle( updatedStyle );

		if ( newStyle.layout !== settings.layout ) {
			setSettings( {
				...rawSettings,
				layout: newStyle.layout,
			} );
		}
	};
	const onChangeBorders = ( newStyle ) => {
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

	const onChangeBehaviors = ( newBehaviors ) => {
		setBehaviors( newBehaviors );
	};

	return (
		<>
			<ScreenHeader
				title={ variation ? currentBlockStyle.label : blockType.title }
			/>
			<BlockPreviewPanel name={ name } variation={ variation } />
			{ hasVariationsPanel && (
				<div className="edit-site-global-styles-screen-variations">
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
			{ hasTypographyPanel && (
				<StylesTypographyPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
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
			{ hasEffectsPanel && (
				<StylesEffectsPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ setStyle }
					settings={ settings }
					includeLayoutControls
				/>
			) }
			{ hasFiltersPanel && (
				<StylesFiltersPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ setStyle }
					settings={ {
						...settings,
						color: {
							...settings.color,
							customDuotone: false, //TO FIX: Custom duotone only works on the block level right now
						},
					} }
					includeLayoutControls
				/>
			) }
			{ canEditCSS && (
				<PanelBody title={ __( 'Advanced' ) } initialOpen={ false }>
					<p>
						{ sprintf(
							// translators: %s: is the name of a block e.g., 'Image' or 'Table'.
							__(
								'Add your own CSS to customize the appearance of the %s block.'
							),
							blockType?.title
						) }
					</p>
					<StylesAdvancedPanel
						value={ style }
						onChange={ setStyle }
						inheritedValue={ inheritedStyle }
					/>
					{ hasBehaviorsPanel && (
						<StylesBehaviorsPanel
							value={ style }
							onChange={ onChangeBehaviors }
							behaviors={ behaviors }
						></StylesBehaviorsPanel>
					) }
				</PanelBody>
			) }
		</>
	);
}

export default ScreenBlock;
