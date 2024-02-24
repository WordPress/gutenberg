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
import ColorVariations from './variations-color';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';

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

	const colorVariations = useCurrentMergeThemeStyleVariationsWithUserConfig( {
		property: 'color',
		filter: ( variation ) =>
			variation?.settings?.color &&
			Object.keys( variation?.settings?.color ).length,
	} );
	return (
		<>
			<ScreenHeader
				title={ __( 'Colors' ) }
				description={ __(
					'Manage palettes and the default color of different global elements on the site.'
				) }
			/>
			<div className="edit-site-global-styles-screen-colors">
				<VStack spacing={ 10 }>
					<Palette />

					<StylesColorPanel
						inheritedValue={ inheritedStyle }
						value={ style }
						onChange={ setStyle }
						settings={ settings }
					/>

					{ !! colorVariations.length && (
						<ColorVariations variations={ colorVariations } />
					) }
				</VStack>
			</div>
		</>
	);
}

export default ScreenColors;
