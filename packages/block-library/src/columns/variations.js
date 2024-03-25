/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * Template option choices for predefined columns layouts.
 *
 * @type {WPBlockVariation[]}
 */
const variations = [
	{
		name: 'one-column-full',
		title: __( '100' ),
		description: __( 'One column' ),
		icon: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M42 0H2C.9 0 0 .9 0 2v28c0 1.1.9 2 2 2h40c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z" />
			</SVG>
		),
		innerBlocks: [ [ 'core/column' ] ],
		scope: [ 'block' ],
	},
	{
		name: 'two-columns-equal',
		title: __( '50 / 50' ),
		description: __( 'Two columns; equal split' ),
		icon: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M42 0H23.5c-.6 0-1 .4-1 1v30c0 .6.4 1 1 1H42c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zM20.5 0H2C.9 0 0 .9 0 2v28c0 1.1.9 2 2 2h18.5c.6 0 1-.4 1-1V1c0-.6-.4-1-1-1z" />
			</SVG>
		),
		isDefault: true,
		innerBlocks: [ [ 'core/column' ], [ 'core/column' ] ],
		scope: [ 'block' ],
	},
	{
		name: 'two-columns-one-third-two-thirds',
		title: __( '33 / 66' ),
		description: __( 'Two columns; one-third, two-thirds split' ),
		icon: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M1 0a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1ZM16 0a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h27a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H16Z" />
			</SVG>
		),
		innerBlocks: [
			[ 'core/column', { width: '33.33%' } ],
			[ 'core/column', { width: '66.66%' } ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'two-columns-two-thirds-one-third',
		title: __( '66 / 33' ),
		description: __( 'Two columns; two-thirds, one-third split' ),
		icon: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M1 0a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h27a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1ZM31 0a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H31Z" />
			</SVG>
		),
		innerBlocks: [
			[ 'core/column', { width: '66.66%' } ],
			[ 'core/column', { width: '33.33%' } ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'three-columns-equal',
		title: __( '33 / 33 / 33' ),
		description: __( 'Three columns; equal split' ),
		icon: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M0 1a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v30a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1ZM15 1a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v30a1 1 0 0 1-1 1H16a1 1 0 0 1-1-1V1ZM31 0a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H31Z" />
			</SVG>
		),
		innerBlocks: [
			[ 'core/column' ],
			[ 'core/column' ],
			[ 'core/column' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'three-columns-wider-center',
		title: __( '25 / 50 / 25' ),
		description: __( 'Three columns; wide center column' ),
		icon: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M0 1a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v30a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1ZM12 1a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v30a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1V1ZM34 0a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-9Z" />
			</SVG>
		),
		innerBlocks: [
			[ 'core/column', { width: '25%' } ],
			[ 'core/column', { width: '50%' } ],
			[ 'core/column', { width: '25%' } ],
		],
		scope: [ 'block' ],
	},
];

export default variations;
