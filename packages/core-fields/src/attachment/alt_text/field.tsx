import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { FieldsScriptParts } from '@wordpress/fields-loader';
import type { MediaItem } from '../types';

/**
 * The JavaScript parts of the alternative text field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	description: (
		<>
			<Link
				href={
					// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
					__(
						'https://www.w3.org/WAI/tutorials/images/decision-tree/'
					)
				}
				openInNewTab
			>
				{ __( 'Describe the purpose of the image.' ) }
			</Link>
			<br />
			{ __( 'Leave empty if decorative.' ) }
		</>
	),
	// Only images have an alternative text.
	isVisible: ( item ) => item?.media_type === 'image',
	render: ( { item } ) => item?.alt_text || '-',
};
