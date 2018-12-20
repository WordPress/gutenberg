/**
 * External dependencies
 */
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import {
	Path,
	G,
	SVG,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/more';

export const settings = {
	title: _x( 'More', 'block name' ),

	description: __( 'Mark the excerpt of this content. Content before this block will be shown in the excerpt on your archives page.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M2 9v2h19V9H2zm0 6h5v-2H2v2zm7 0h5v-2H9v2zm7 0h5v-2h-5v2z" /></G></SVG>,

	category: 'layout',

	supports: {
		customClassName: false,
		className: false,
		html: false,
		multiple: false,
	},

	attributes: {
		customText: {
			type: 'string',
		},
		noTeaser: {
			type: 'boolean',
			default: false,
		},
	},

	transforms: {
		from: [
			{
				type: 'raw',
				schema: {
					'wp-block': { attributes: [ 'data-block' ] },
				},
				isMatch: ( node ) => node.dataset && node.dataset.block === 'core/more',
				transform( node ) {
					const { customText, noTeaser } = node.dataset;
					const attrs = {};
					// Don't copy unless defined and not an empty string
					if ( customText ) {
						attrs.customText = customText;
					}
					// Special handling for boolean
					if ( noTeaser === '' ) {
						attrs.noTeaser = true;
					}
					return createBlock( 'core/more', attrs );
				},
			},
		],
	},

	edit,

	save( { attributes } ) {
		const { customText, noTeaser } = attributes;

		const moreTag = customText ?
			`<!--more ${ customText }-->` :
			'<!--more-->';

		const noTeaserTag = noTeaser ?
			'<!--noteaser-->' :
			'';

		return (
			<RawHTML>
				{ compact( [ moreTag, noTeaserTag ] ).join( '\n' ) }
			</RawHTML>
		);
	},
};
