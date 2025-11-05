/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import { useStyle } from './hooks';
import { unlock } from './lock-unlock';

// Access AdvancedPanel from block-editor private APIs
const { AdvancedPanel: StylesAdvancedPanel } = unlock( blockEditorPrivateApis );

function ScreenCSS() {
	const description = __(
		'Add your own CSS to customize the appearance and layout of your site.'
	);

	// Get user-only styles (should not decode/encode to preserve raw CSS)
	const [ style ] = useStyle( '', undefined, 'user', false );
	// Get all styles (inherited + user) for context
	const [ inheritedStyle, setStyle ] = useStyle(
		'',
		undefined,
		'merged',
		false
	);

	return (
		<>
			<ScreenHeader title={ __( 'CSS' ) } description={ description } />
			<div className="global-styles-ui-screen-css">
				<ExternalLink
					href={ __(
						'https://developer.wordpress.org/advanced-administration/wordpress/css/'
					) }
					className="global-styles-ui-screen-css-help-link"
				>
					{ __( 'Learn more about CSS' ) }
				</ExternalLink>
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
