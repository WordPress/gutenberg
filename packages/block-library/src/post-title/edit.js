/**
 * WordPress dependencies
 */
import {
	useEditEntity,
	RichText,
	useEditedEntityAttribute,
} from '@wordpress/block-editor';
import { cleanForSlug } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export default function PostTitleEdit() {
	const editEntity = useEditEntity();
	return (
		<RichText
			value={ useEditedEntityAttribute( 'title' ) }
			onChange={ ( value ) =>
				editEntity( {
					title: value,
					slug: cleanForSlug( value ),
				} )
			}
			tagName="h1"
			placeholder={ __( 'Title' ) }
			formattingControls={ [] }
		/>
	);
}
