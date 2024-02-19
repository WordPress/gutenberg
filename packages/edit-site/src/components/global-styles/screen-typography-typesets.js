/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TypographyVariations from './variations-typography';
import ScreenHeader from './header';

export default function ScreenTypographyTypesets() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Typeset' ) }
				description={ __(
					"Apply a typography style variation to your site's font styles and settings."
				) }
			/>
			<div className="edit-site-global-styles-screen-typography">
				<TypographyVariations />
			</div>
		</>
	);
}
