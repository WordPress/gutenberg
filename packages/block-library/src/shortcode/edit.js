/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';
import { PlainText } from '@wordpress/block-editor';
import { withInstanceId } from '@wordpress/compose';

const ShortcodeEdit = ( { attributes, setAttributes, instanceId } ) => {
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
};

export default withInstanceId( ShortcodeEdit );
