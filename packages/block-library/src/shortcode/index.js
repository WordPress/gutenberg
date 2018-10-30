/**
 * WordPress dependencies
 */
import { removep, autop } from '@wordpress/autop';
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon, SVG, Path } from '@wordpress/components';
import { PlainText } from '@wordpress/editor';
import { withInstanceId } from '@wordpress/compose';

export const name = 'core/shortcode';

export const settings = {
	title: __( 'Shortcode' ),

	description: __( 'Add a shortcode -- a WordPress-specific snippet of code written between square brackets.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M8.5,21.4l1.9,0.5l5.2-19.3l-1.9-0.5L8.5,21.4z M3,19h4v-2H5V7h2V5H3V19z M17,5v2h2v10h-2v2h4V5H17z" /></SVG>,

	category: 'widgets',

	attributes: {
		text: {
			type: 'string',
			source: 'text',
		},
	},

	transforms: {
		from: [
			{
				type: 'shortcode',
				// Per "Shortcode names should be all lowercase and use all
				// letters, but numbers and underscores should work fine too.
				// Be wary of using hyphens (dashes), you'll be better off not
				// using them." in https://codex.wordpress.org/Shortcode_API
				// Require that the first character be a letter. This notably
				// prevents footnote markings ([1]) from being caught as
				// shortcodes.
				tag: '[a-z][a-z0-9_-]*',
				attributes: {
					text: {
						type: 'string',
						shortcode: ( attrs, { content } ) => {
							return removep( autop( content ) );
						},
					},
				},
				priority: 20,
			},
		],
	},

	supports: {
		customClassName: false,
		className: false,
		html: false,
	},

	edit: withInstanceId(
		( { attributes, setAttributes, instanceId } ) => {
			const inputId = `blocks-shortcode-input-${ instanceId }`;

			return (
				<div className="wp-block-shortcode">
					<label htmlFor={ inputId }>
						<Dashicon icon="shortcode" />
						{ __( 'Shortcode' ) }
					</label>
					<PlainText
						className="input-control"
						id={ inputId }
						value={ attributes.text }
						placeholder={ __( 'Write shortcode here…' ) }
						onChange={ ( text ) => setAttributes( { text } ) }
					/>
				</div>
			);
		}
	),

	save( { attributes } ) {
		return <RawHTML>{ attributes.text }</RawHTML>;
	},
};
