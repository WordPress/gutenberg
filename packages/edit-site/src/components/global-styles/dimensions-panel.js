/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

const {
	useGlobalStyle,
	useGlobalSetting,
	useSettingsForBlockElement,
	DimensionsPanel: StylesDimensionsPanel,
} = unlock( blockEditorPrivateApis );

const DEFAULT_CONTROLS = {
	contentSize: true,
	wideSize: true,
	padding: true,
	margin: true,
	blockGap: true,
	minHeight: true,
	childLayout: false,
};

export default function DimensionsPanel( { name, variation = '' } ) {
	let prefixParts = [];
	if ( variation ) {
		prefixParts = [ 'variations', variation ].concat( prefixParts );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useGlobalStyle( prefix, name, 'user', false );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( prefix, name, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ rawSettings, setSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );

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

	const onChange = ( newStyle ) => {
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
		<StylesDimensionsPanel
			inheritedValue={ inheritedStyleWithLayout }
			value={ styleWithLayout }
			onChange={ onChange }
			settings={ settings }
			includeLayoutControls
			defaultControls={ DEFAULT_CONTROLS }
		/>
	);
}
