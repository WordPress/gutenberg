/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/playlist';

export const settings = {
	title: __( 'Playlist' ),

	description: __( 'The Playlist block allows you to embed playlist files.' ),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><path d="m12 3l0.01 10.55c-0.59-0.34-1.27-0.55-2-0.55-2.22 0-4.01 1.79-4.01 4s1.79 4 4.01 4 3.99-1.79 3.99-4v-10h4v-4h-6zm-1.99 16c-1.1 0-2-0.9-2-2s0.9-2 2-2 2 0.9 2 2-0.9 2-2 2z" /></svg>,

	category: 'common',

	attributes: {
		ids: {
			type: 'string',
		},
		type: {
			type: 'string',
			default: 'audio',
		},
		showTrackNumbers: {
			type: 'boolean',
			default: true,
		},
		showArtists: {
			type: 'boolean',
			default: true,
		},
		images: {
			type: 'boolean',
			default: true,
		},
		tracklist: {
			type: 'boolean',
			default: true,
		},
		style: {
			type: 'string',
			default: 'light',
		},
		align: {
			type: 'string',
		},
	},

	supports: {
		align: true,
		html: false,
	},

	edit,

	save() {
		return null;
	},
};
