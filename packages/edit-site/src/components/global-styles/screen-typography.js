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
import BlockPreviewPanel from './block-preview-panel';

function ScreenTypography() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the typography settings for different elements.'
				) }
			/>

			<BlockPreviewPanel />

			<div className="edit-site-global-styles-screen-typography">
				<VStack spacing={ 6 }>
					<FontFamilies />
					<TypographyElements />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;
