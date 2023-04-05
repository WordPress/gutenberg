/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
const {
	useGlobalStyle,
	useGlobalSetting,
	useSettingsForBlockElement,
	FiltersPanel: StylesFiltersPanel,
} = unlock( blockEditorPrivateApis );

export default function FiltersPanel( { name } ) {
	const [ style ] = useGlobalStyle( '', name, 'user', false );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', name, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ rawSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );

	return (
		<StylesFiltersPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
		/>
	);
}
