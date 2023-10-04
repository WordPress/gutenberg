/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TypographyElements from './typogrphy-elements';
import FontFamilies from './font-families';
import ScreenHeader from './header';

function ScreenTypography() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the typography settings for different elements.'
				) }
			/>
			<div className="edit-site-global-styles-screen-typography">
				<VStack spacing={ 6 }>
					{ ! window.__experimentalDisableFontLibrary && (
						<FontFamilies />
					) }
					<TypographyElements />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;
