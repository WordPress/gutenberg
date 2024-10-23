/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ScreenHeader from './header';

const { useGlobalStyle, AdvancedPanel: StylesAdvancedPanel } = unlock(
	blockEditorPrivateApis
);

function ScreenCSS() {
	const description = __(
		'Add your own CSS to customize the appearance and layout of your site.'
	);
	const [ style ] = useGlobalStyle( '', undefined, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', undefined, 'all', {
		shouldDecodeEncode: false,
	} );

	return (
		<>
			<ScreenHeader
				title={ __( 'CSS' ) }
				description={
					<>
						{ description }
						<br />
						<ExternalLink
							href={ __(
								'https://developer.wordpress.org/advanced-administration/wordpress/css/'
							) }
							className="edit-site-global-styles-screen-css-help-link"
						>
							{ __( 'Learn more about CSS' ) }
						</ExternalLink>
					</>
				}
			/>
			<div className="edit-site-global-styles-screen-css">
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
