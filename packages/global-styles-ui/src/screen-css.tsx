import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { ScreenHeader } from './screen-header';
import { useStyle } from './hooks';
import { unlock } from './lock-unlock';

// Access AdvancedPanel from block-editor private APIs
const { AdvancedPanel: StylesAdvancedPanel } = unlock( blockEditorPrivateApis );

function ScreenCSS() {
	// User-only styles (should not decode/encode to preserve raw CSS).
	const [ style, setStyle ] = useStyle( '', undefined, 'user', false );
	// Merged (theme.json + user) styles, previewed when there's no local override.
	const [ inheritedStyle ] = useStyle( '', undefined, 'merged', false );

	return (
		<>
			<ScreenHeader
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
