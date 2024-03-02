/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ChainIcon } from './icons';

/**
 * Retrieves the display label for the social service.
 *
 * @param {Object} activeVariation The object of the active social service variation
 *
 * @return {string} Display label for social service
 */
const getSocialServiceLabel = ( activeVariation ) => {
	const title = activeVariation?.title ?? activeVariation.name;
	return title;
};

/**
 * Retrieves the social service's icon component and label.
 *
 * @param {Object} activeVariation The object of the active social service variation
 *
 * @return {Object} An opject containing the Icon component for social service and label.
 */
export const getSocialService = ( activeVariation ) => {
	if ( activeVariation?.name ) {
		return {
			icon: activeVariation?.icon ?? ChainIcon,
			label: getSocialServiceLabel( activeVariation ),
		};
	}

	// Default to Mail if no active variation is found.
	return {
		icon: ChainIcon,
		label: __( 'Social Icon' ),
	};
};
