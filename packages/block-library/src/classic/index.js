/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Path, Rect, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/freeform';

export const settings = {
	title: _x( 'Classic', 'block title' ),

	description: __( 'It’s the classic WordPress editor and it’s a block! Drop the editor right in.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none" /><Path d="m20 7v10h-16v-10h16m0-2h-16c-1.1 0-1.99 0.9-1.99 2l-0.01 10c0 1.1 0.9 2 2 2h16c1.1 0 2-0.9 2-2v-10c0-1.1-0.9-2-2-2z" /><Rect x="11" y="8" width="2" height="2" /><Rect x="11" y="11" width="2" height="2" /><Rect x="8" y="8" width="2" height="2" /><Rect x="8" y="11" width="2" height="2" /><Rect x="5" y="11" width="2" height="2" /><Rect x="5" y="8" width="2" height="2" /><Rect x="8" y="14" width="8" height="2" /><Rect x="14" y="11" width="2" height="2" /><Rect x="14" y="8" width="2" height="2" /><Rect x="17" y="11" width="2" height="2" /><Rect x="17" y="8" width="2" height="2" /></SVG>,

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
		},
	},

	supports: {
		className: false,
		customClassName: false,
	},

	edit,

	save( { attributes } ) {
		const { content } = attributes;

		return <RawHTML>{ content }</RawHTML>;
	},
};
