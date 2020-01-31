/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { Editable } from '@wordpress/block-editor';

export default function SiteTitleEdit() {
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	return (
		<Editable
			tagName="h1"
			placeholder={ __( 'Site Title' ) }
			value={ title }
			onChange={ setTitle }
			disableLineBreaks
		/>
	);
}
