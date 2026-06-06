/**
 * WordPress dependencies
 */
import { POST_TYPES_PATH } from '@wordpress/content-types';
import { __ } from '@wordpress/i18n';
import { redirect } from '@wordpress/route';

export const route = {
	beforeLoad: () => {
		throw redirect( { to: POST_TYPES_PATH } );
	},
	title: () => __( 'Content Types' ),
};
