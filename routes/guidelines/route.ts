/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { bootstrapBlockRegistry } from './bootstrap-block-registry';

export const route = {
	beforeLoad: bootstrapBlockRegistry,
	title: () => __( 'Guidelines' ),
};
