/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerGuidelineEntities } from './entity';

export const route = {
	beforeLoad: () => {
		registerGuidelineEntities();
	},
	title: () => __( 'Guidelines' ),
};
