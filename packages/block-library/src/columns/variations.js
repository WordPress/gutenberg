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
				width="48"
				height="48"
				viewBox="0 0 48 48"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M42 10H6C4.89543 10 4 10.8954 4 12V36C4 37.1046 4.89543 38 6 38H42C43.1046 38 44 37.1046 44 36V12C44 10.8954 43.1046 10 42 10ZM6 11.5H42C42.2761 11.5 42.5 11.7239 42.5 12V36C42.5 36.2761 42.2761 36.5 42 36.5H6C5.72386 36.5 5.5 36.2761 5.5 36V12C5.5 11.7239 5.72386 11.5 6 11.5Z"
					fill="currentColor"
				/>
			</SVG>
		),
		innerBlocks: [ [ 'core/column' ] ],
		scope: [ 'block' ],
	},
	{
		name: 'two-columns-equal',
		title: __( '50/50' ),
		description: __( 'Two columns; equal split' ),
		icon: (
			<SVG
				width="48"
				height="48"
				viewBox="0 0 48 48"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M23.5 11.5H6C5.72386 11.5 5.5 11.7239 5.5 12V36C5.5 36.2761 5.72386 36.5 6 36.5H23.5V11.5ZM25 11.5H42C42.2761 11.5 42.5 11.7239 42.5 12V36C42.5 36.2761 42.2761 36.5 42 36.5H25V11.5ZM6 10H42C43.1046 10 44 10.8954 44 12V36C44 37.1046 43.1046 38 42 38H6C4.89543 38 4 37.1046 4 36V12C4 10.8954 4.89543 10 6 10Z"
					fill="currentColor"
				/>
			</SVG>
		),
		isDefault: true,
		innerBlocks: [ [ 'core/column' ], [ 'core/column' ] ],
		scope: [ 'block' ],
	},
	{
		name: 'three-columns-equal',
		title: __( '33/33/33' ),
		description: __( 'Three columns; equal split' ),
		icon: (
			<SVG
				width="48"
				height="48"
				viewBox="0 0 48 48"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M42 10H6C4.89543 10 4 10.8954 4 12V36C4 37.1046 4.89543 38 6 38H42C43.1046 38 44 37.1046 44 36V12C44 10.8954 43.1046 10 42 10ZM6 11.5H16.5V36.5H6C5.72386 36.5 5.5 36.2761 5.5 36V12C5.5 11.7239 5.72386 11.5 6 11.5ZM30 11.5H18V36.5H30V11.5ZM31.5 11.5V36.5H42C42.2761 36.5 42.5 36.2761 42.5 36V12C42.5 11.7239 42.2761 11.5 42 11.5H31.5Z"
					fill="currentColor"
				/>
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
		name: 'two-columns-one-third-two-thirds',
		title: __( '33/66' ),
		description: __( 'Two columns; one-third, two-thirds split' ),
		icon: (
			<SVG
				width="48"
				height="48"
				viewBox="0 0 48 48"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M6 10H42C43.1046 10 44 10.8954 44 12V36C44 37.1046 43.1046 38 42 38H6C4.89543 38 4 37.1046 4 36V12C4 10.8954 4.89543 10 6 10ZM16.5 11.5H6C5.72386 11.5 5.5 11.7239 5.5 12V36C5.5 36.2761 5.72386 36.5 6 36.5H16.5V11.5ZM18 11.5H42C42.2761 11.5 42.5 11.7239 42.5 12V36C42.5 36.2761 42.2761 36.5 42 36.5H18V11.5Z"
					fill="currentColor"
				/>
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
		title: __( '66/33' ),
		description: __( 'Two columns; two-thirds, one-third split' ),
		icon: (
			<SVG
				width="48"
				height="48"
				viewBox="0 0 48 48"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M6 10H42C43.1046 10 44 10.8954 44 12V36C44 37.1046 43.1046 38 42 38H6C4.89543 38 4 37.1046 4 36V12C4 10.8954 4.89543 10 6 10ZM29.5 11.5H6C5.72386 11.5 5.5 11.7239 5.5 12V36C5.5 36.2761 5.72386 36.5 6 36.5H29.5V11.5ZM31 11.5H42C42.2761 11.5 42.5 11.7239 42.5 12V36C42.5 36.2761 42.2761 36.5 42 36.5H31V11.5Z"
					fill="currentColor"
				/>
			</SVG>
		),
		innerBlocks: [
			[ 'core/column', { width: '66.66%' } ],
			[ 'core/column', { width: '33.33%' } ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'three-columns-wider-center',
		title: __( '25/50/25' ),
		description: __( 'Three columns; wide center column' ),
		icon: (
			<SVG
				width="48"
				height="48"
				viewBox="0 0 48 48"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M42 10H6C4.89543 10 4 10.8954 4 12V36C4 37.1046 4.89543 38 6 38H42C43.1046 38 44 37.1046 44 36V12C44 10.8954 43.1046 10 42 10ZM6 11.5H14.5V36.5H6C5.72386 36.5 5.5 36.2761 5.5 36V12C5.5 11.7239 5.72386 11.5 6 11.5ZM32 11.5H16V36.5H32V11.5ZM33.5 11.5V36.5H42C42.2761 36.5 42.5 36.2761 42.5 36V12C42.5 11.7239 42.2761 11.5 42 11.5H33.5Z"
					fill="currentColor"
				/>
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
