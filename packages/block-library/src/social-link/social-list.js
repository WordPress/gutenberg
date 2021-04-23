/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { ChainIcon } from './icons';

/**
 * Retrieves the social service's icon component.
 *
 * @param {string} name key for a social service (lowercase slug)
 *
 * @return {WPComponent} Icon component for social service.
 */
export const useServiceIcon = ( name ) => {
	const variations = useSelect( ( select ) => {
		const { getBlockVariations } = select( blocksStore );
		return getBlockVariations( 'core/social-link', 'block' );
	} );
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
export const useServiceName = ( name ) => {
	const variations = useSelect( ( select ) => {
		const { getBlockVariations } = select( blocksStore );
		return getBlockVariations( 'core/social-link', 'block' );
	} );
	const variation = find( variations, { name } );
	return variation ? variation.title : __( 'Social Icon' );
};
