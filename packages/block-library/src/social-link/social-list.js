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
 * @return {Component} Icon component for social service.
 */
export const getIconBySite = ( name ) => {
	const variation = variations.find( ( v ) => v.name === name );
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
	const variation = variations.find( ( v ) => v.name === name );
	return variation ? variation.title : __( 'Social Icon' );
};

/**
 * Retrieves the matching social service based on the URL.
 *
 * @param {string} url URL to match against.
 * @return {Object} Social service variation.
 */
export function getMatchingService( url ) {
	const variataion = variations.find( ( { patterns } ) =>
		patterns?.some( ( pattern ) => pattern.test( url ) )
	);

	return variataion?.attributes?.service;
}
