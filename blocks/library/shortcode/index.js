/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';

registerBlockType( 'core/shortcode', {
	title: __( 'Shortcode' ),

	description: __( 'A shortcode is a WordPress-specific code snippet that is written between square brackets as [shortcode]. ' ),

	icon: 'marker',

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
							return content;
						},
					},
				},
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
						<Dashicon icon="editor-code" />
						{ __( 'Shortcode' ) }
					</label>
					<TextareaAutosize
						id={ inputId }
						autoComplete="off"
						value={ attributes.text }
						placeholder={ __( 'Write shortcode here…' ) }
						onChange={ ( event ) => setAttributes( {
							text: event.target.value,
						} ) }
					/>
				</div>
			);
		}
	),

	save( { attributes } ) {
		return attributes.text;
	},
} );
