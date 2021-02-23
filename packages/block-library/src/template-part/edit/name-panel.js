/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function TemplatePartNamePanel( { postId } ) {
	const [ title, setTitle ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		postId
	);

	return (
		<TextControl
			label={ __( 'Title' ) }
			value={ title }
			onChange={ ( value ) => {
				setTitle( value );
			} }
			onFocus={ ( event ) => event.target.select() }
		/>
	);
}
