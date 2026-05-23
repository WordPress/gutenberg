/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { drafts } from '@wordpress/icons';

/*
 * Widget type definition
 */
export default {
	name: 'core/quick-draft',
	title: __( 'Quick Draft' ),
	icon: drafts,
};
