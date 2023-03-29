/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';
import { unlock } from '../../private-apis';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useGlobalSetting,
	useSettingsForBlockElement,
	useHasColorPanel,
	useGlobalStyle,
	BorderPanel: StylesBorderPanel,
	ColorPanel: StylesColorPanel,
	TypographyPanel: StylesTypographyPanel,
	DimensionsPanel: StylesDimensionsPanel,
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
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasBorderPanel = useHasBorderPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );

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
			<ScreenHeader title={ blockType.title } />
			<BlockPreviewPanel name={ name } variation={ variation } />
			{ hasTypographyPanel && (
				<StylesTypographyPanel
					inheritedValue={ inheritedStyle }
					value={ style }
					onChange={ setStyle }
					settings={ settings }
				/>
			) }
			{ hasColorPanel && (
				<StylesColorPanel
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
		</>
	);
}

export default ScreenBlock;
