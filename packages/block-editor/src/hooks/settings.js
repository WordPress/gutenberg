/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

function addAttribute( settings ) {
	if ( ! settings?.supports?.__experimentalSettings ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( ! settings?.attributes?.settings ) {
		settings.attributes = {
			...settings.attributes,
			settings: {
				type: 'object',
			},
		};
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/settings/addAttribute',
	addAttribute
);
