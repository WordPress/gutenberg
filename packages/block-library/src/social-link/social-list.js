/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import variations from './variations';

/**
 * Retrieves the display name for the social service.
 *
 * @param {string} name key for a social service (lowercase slug)
 *
 * @return {string} Display name for social service
 */
export const getTitleForService = ( service ) => {
	const variation = find( variations, { service } );
	return variation ? variation.title : __( 'Social Link' );
};
