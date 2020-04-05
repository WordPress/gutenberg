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
import { ChainIcon } from './icons';

/**
 * Retrieves the social service's icon component.
 *
 * @param {string} name key for a social service (lowercase slug)
 *
 * @return {WPComponent} Icon component for social service.
 */
export const getIconBySite = ( name ) => {
	const variation = find( variations, { name } );
	return variation ? variation.icon : ChainIcon;
};

/**
 * Retrieves the display name for the social service.
 *
 * @param {string} name key for a social service (lowercase slug)
 *
 * @return {string} Display name for social service
 */
export const getNameBySite = ( name ) => {
	const variation = find( variations, { name } );
	return variation ? variation.title : __( 'Social Icon' );
};
