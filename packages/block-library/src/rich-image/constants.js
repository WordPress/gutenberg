/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

export const isSupportedBlock = ( blockName ) =>
	[ 'core/image', 'core/cover' ].includes( blockName );

export const supportedFilters = [
	{
		title: __( 'Technicolor' ),
		value: 'technicolor',
	},
	{
		title: __( 'Black & White' ),
		value: 'black-and-white',
	},
	{
		title: __( 'Sunshine' ),
		value: 'sunshine',
	},
	{
		title: __( 'Aviator' ),
		value: 'aviator',
	},
	{
		title: __( 'Polar Vortex' ),
		value: 'polar-vortex',
	},
	{
		title: __( 'Rocketeer' ),
		value: 'rocketeer',
	},
	{
		title: __( 'Black Hole' ),
		value: 'black-hole',
	},
];

export const richImageAttributes = {
	imageCropWidth: {
		type: 'number',
		default: 200,
	},
	imageCropHeight: {
		type: 'number',
		default: 200,
	},
	imageCropX: {
		type: 'number',
		default: 0,
	},
	imageCropY: {
		type: 'number',
		default: 0,
	},
	imageFilter: {
		type: 'string',
		default: '',
	},
};
