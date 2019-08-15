/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { RichText } from '@wordpress/block-editor';
import { cleanForSlug } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export default function PostTitleEdit() {
	const title = useSelect(
		( select ) => select( 'core/editor' ).getEditedEntityAttribute( 'title' ),
		[]
	);
	const dispatch = useDispatch();
	return (
		<RichText
			value={ title }
			onChange={ ( value ) =>
				dispatch( 'core/editor' ).editEntity( {
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
