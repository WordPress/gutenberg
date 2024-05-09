/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Palette from './palette';
import { unlock } from '../../lock-unlock';

const {
	useGlobalStyle,
	useGlobalSetting,
	useSettingsForBlockElement,
	ColorPanel: StylesColorPanel,
} = unlock( blockEditorPrivateApis );

function ScreenColors() {
	const [ style ] = useGlobalStyle( '', undefined, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', undefined, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );

	return (
		<>
			<ScreenHeader
				title={ __( 'Colors' ) }
				description={ __(
					'Palette colors and the application of those colors on site elements.'
				) }
			/>
			<div className="edit-site-global-styles-screen">
				<VStack spacing={ 7 }>
					<Palette />
					<StylesColorPanel
						inheritedValue={ inheritedStyle }
						value={ style }
						onChange={ setStyle }
						settings={ settings }
					/>
				</VStack>
			</div>
		</>
	);
}

export default ScreenColors;
