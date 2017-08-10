/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, source } from '../../api';

const { text } = source;

registerBlockType( 'core/shortcode', {
	title: __( 'Shortcode' ),

	icon: 'editor-code',

	category: 'widgets',

	attributes: {
		text: {
			type: 'string',
			source: text(),
		},
	},

	edit: withInstanceId(
		( { attributes, setAttributes, className, instanceId } ) => {
			const inputId = `blocks-shortcode-input-${ instanceId }`;

			return (
				<div className={ className }>
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
				</div>
			);
		}
	),

	save( { attributes } ) {
		return attributes.text;
	},
} );
