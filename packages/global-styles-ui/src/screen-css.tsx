/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
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
	// Get user-only styles (should not decode/encode to preserve raw CSS)
	const [ style ] = useStyle( '', undefined, 'user', false );
	// Get all styles (inherited + user) for context
	const [ inheritedStyle, setStyle ] = useStyle(
		'',
		undefined,
		'merged',
		false
	);

	// Get the global styles ID
	const globalStylesId = useSelect( ( select ) => {
		// @ts-expect-error: Experimental API not in types yet
		return select( coreStore ).__experimentalGetCurrentGlobalStylesId();
	}, [] );

	// Get server-side save error
	const serverError = useSelect(
		( select ) => {
			if ( ! globalStylesId ) {
				return null;
			}

			const error = select( coreStore ).getLastEntitySaveError(
				'root',
				'globalStyles',
				globalStylesId
			);

			// Extract error message from the error object
			if ( error?.message ) {
				return error.message;
			}
			if ( typeof error === 'string' ) {
				return error;
			}
			return null;
		},
		[ globalStylesId ]
	);

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
					serverError={ serverError }
				/>
			</div>
		</>
	);
}

export default ScreenCSS;
