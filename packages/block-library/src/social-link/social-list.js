/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ChainIcon } from './icons';

/**
 * Retrieves the social service's icon component and label.
 *
 * @param {Object} variation The object of the social service variation.
 * @return {Object} An object containing the Icon component for social service and label.
 */
export function getSocialService( variation ) {
	if ( ! variation?.name ) {
		return {
			icon: ChainIcon,
			label: __( 'Social Icon' ),
		};
	}

	return {
		icon: variation?.icon ?? ChainIcon,
		label: variation?.title ?? __( 'Social Icon' ),
	};
}
