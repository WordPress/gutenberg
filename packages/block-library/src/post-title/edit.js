/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { RichText } from '@wordpress/block-editor';
import { cleanForSlug } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export default function PostTitleEdit() {
	const [ title, setTitle ] = useEntityProp( 'post', 'title' );
	const [ , setSlug ] = useEntityProp( 'post', 'slug' );
	return (
		<RichText
			value={ title }
			onChange={ ( value ) => {
				setTitle( value );
				setSlug( cleanForSlug( value ) );
			} }
			tagName="h1"
			placeholder={ __( 'Title' ) }
			formattingControls={ [] }
		/>
	);
}
