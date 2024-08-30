/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PlainText, useBlockProps } from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';
import { Placeholder } from '@wordpress/components';
import { shortcode } from '@wordpress/icons';

export default function ShortcodeEdit( { attributes, setAttributes } ) {
	const instanceId = useInstanceId( ShortcodeEdit );
	const inputId = `blocks-shortcode-input-${ instanceId }`;

	return (
		<div { ...useBlockProps() }>
			<Placeholder icon={ shortcode } label={ __( 'Shortcode' ) }>
				<PlainText
					className="blocks-shortcode__textarea"
					id={ inputId }
					value={ attributes.text }
					aria-label={ __( 'Shortcode text' ) }
					placeholder={ __( 'Write shortcode here…' ) }
					onChange={ ( text ) => setAttributes( { text } ) }
				/>
			</Placeholder>
		</div>
	);
}
