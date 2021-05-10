/**
 * WordPress dependencies
 */
import { mapMarker as icon } from '@wordpress/icons';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import AccessibleSteps from './util/accessible-steps';

const { name } = metadata;
export { metadata, name };

export const settings = {
	description: createInterpolateElement(
		__(
			'Displays and allows editing the name of the site. The site title usually appears in the browser title bar, in search results, and more. Also available in <path/>.'
		),
		{
			path: (
				<AccessibleSteps
					elements={ [ __( 'Settings' ), __( 'General' ) ] }
					link="options-general.php"
				/>
			),
		}
	),
	icon,
	edit,
};
