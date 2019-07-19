/**
 * WordPress dependencies
 */
import { PlainText } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

function SiteTitleEdit( { attributes, setAttributes } ) {
	const { title } = attributes;

	return (
		<div className="wp-block-site-title">
			<PlainText
				value={ title }
				onChange={ ( newTitle ) => setAttributes( { title: newTitle } ) }
				placeholder={ __( 'Site Title' ) }
				aria-label={ __( 'Site Title' ) }
			/>
		</div>
	);
}

export default SiteTitleEdit;
