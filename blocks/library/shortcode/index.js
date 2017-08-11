/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType, source } from '../../api';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { text } = source;

registerBlockType( 'core/shortcode', {
	title: __( 'Shortcode' ),

	icon: 'marker',

	category: 'widgets',

	attributes: {
		text: {
			type: 'string',
			source: text(),
		},
	},

	className: false,

	edit: withInstanceId(
		( { attributes, setAttributes, instanceId, focus } ) => {
			const inputId = `blocks-shortcode-input-${ instanceId }`;

			return (
				<div className="wp-block-shortcode">
					<label htmlFor={ inputId }>
						<Dashicon icon="editor-code" />
						{ __( 'Shortcode' ) }
					</label>
					<input
						id={ inputId }
						type="text"
						value={ attributes.text }
						placeholder={ __( 'Write shortcode here…' ) }
						onChange={ ( event ) => setAttributes( {
							text: event.target.value,
						} ) } />
					{ focus &&
						<InspectorControls>
							<BlockDescription>
								<p>{ __( 'A shortcode is a WordPress-specific code snippet that is written between square brackets as [shortcode]. ' ) }</p>
							</BlockDescription>
						</InspectorControls>
					}
				</div>
			);
		}
	),

	save( { attributes } ) {
		return attributes.text;
	},
} );
