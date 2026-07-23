/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { bootstrapBlockRegistry } from './bootstrap-block-registry';
import { registerGuidelineScopeEntity } from './entity';

export const route = {
	beforeLoad: () => {
		bootstrapBlockRegistry();
		registerGuidelineScopeEntity();
	},
	title: () => __( 'Guidelines' ),
};
