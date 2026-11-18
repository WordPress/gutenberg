import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import PresetEditHeader from './presets/preset-edit-header';
import { useStyle } from './hooks';
import { unlock } from './lock-unlock';

// Access AdvancedPanel from block-editor private APIs
const { AdvancedPanel: StylesAdvancedPanel } = unlock( blockEditorPrivateApis );

function ScreenCSS() {
	// User-only styles (should not decode/encode to preserve raw CSS).
	const [ style, setStyle ] = useStyle( '', undefined, 'user', false );
	// Merged (theme.json + user) styles, previewed when there's no local override.
	const [ inheritedStyle ] = useStyle( '', undefined, 'merged', false );
	// Compare against theme-default CSS so Reset remains available when the
	// user has cleared CSS to an empty string while the theme provides one.
	const [ themeStyle ] = useStyle( '', undefined, 'base', false );
	const canReset = inheritedStyle?.css !== themeStyle?.css;

	return (
		<>
			<PresetEditHeader
				title={ __( 'Additional CSS' ) }
				description={
					<>
						{ __(
							'You can add custom CSS to further customize the appearance and layout of your site.'
						) }
						<br />
						<ExternalLink
							href={ __(
								'https://developer.wordpress.org/advanced-administration/wordpress/css/'
							) }
							className="global-styles-ui-screen-css-help-link"
						>
							{ __( 'Learn more about CSS' ) }
						</ExternalLink>
					</>
				}
				menuLabel={ __( 'CSS options' ) }
				menuItems={ [
					{
						label: __( 'Reset' ),
						disabled: ! canReset,
						onClick: () => {
							const { css: _css, ...rest } = style ?? {};
							setStyle( rest );
						},
					},
				] }
			/>
			<div className="global-styles-ui-screen-css">
				<StylesAdvancedPanel
					value={ style }
					onChange={ setStyle }
					inheritedValue={ inheritedStyle }
				/>
			</div>
		</>
	);
}

export default ScreenCSS;
