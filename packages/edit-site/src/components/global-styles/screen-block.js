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
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';
import { unlock } from '../../private-apis';
import Subtitle from './subtitle';
import { useBlockVariations, VariationsPanel } from './variations-panel';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useGlobalSetting,
	useSettingsForBlockElement,
	useHasColorPanel,
	useHasEffectsPanel,
	useHasFiltersPanel,
	useGlobalStyle,
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
	const blockType = getBlockType( name );
	const blockVariations = useBlockVariations( name );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
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
					onChange={ setStyle }
					settings={ settings }
				/>
			) }
			{ hasEffectsPanel && (
				<StylesEffectsPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ onChangeDimensions }
					settings={ settings }
					includeLayoutControls
				/>
			) }
			{ hasFiltersPanel && (
				<StylesFiltersPanel
					inheritedValue={ inheritedStyleWithLayout }
					value={ styleWithLayout }
					onChange={ onChangeDimensions }
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
				</PanelBody>
			) }
		</>
	);
}

export default ScreenBlock;
