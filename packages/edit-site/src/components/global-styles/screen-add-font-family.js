/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalSurface as Surface } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import TabGoogleFontFamilies from './tab-google-font-families';

function ScreenAddFontFamily( { setGoogleFontSelected } ) {
	return (
		<>
			<ScreenHeader
				title={ __( 'Add Font Family' ) }
				description={ __( 'Add fonts to your site' ) }
			/>

			<Surface>
				<TabGoogleFontFamilies
					setGoogleFontSelected={ setGoogleFontSelected }
				/>
			</Surface>
		</>
	);
}

export default ScreenAddFontFamily;
