/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { safeDecodeURIComponent, cleanForSlug } from '@wordpress/url';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostSlugCheck from './check';
import { store as editorStore } from '../../store';

function PostSlugControl() {
	const postSlug = useSelect( ( select ) => {
		return safeDecodeURIComponent(
			select( editorStore ).getEditedPostSlug()
		);
	}, [] );
	const { editPost } = useDispatch( editorStore );
	const [ forceEmptyField, setForceEmptyField ] = useState( false );

	return (
		<TextControl
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
			__nextHasNoMarginBottom
			label={ __( 'Slug' ) }
			autoComplete="off"
			spellCheck="false"
			value={ forceEmptyField ? '' : postSlug }
			onChange={ ( newValue ) => {
				editPost( { slug: newValue } );
				// When we delete the field the permalink gets
				// reverted to the original value.
				// The forceEmptyField logic allows the user to have
				// the field temporarily empty while typing.
				if ( ! newValue ) {
					if ( ! forceEmptyField ) {
						setForceEmptyField( true );
					}
					return;
				}
				if ( forceEmptyField ) {
					setForceEmptyField( false );
				}
			} }
			onBlur={ ( event ) => {
				editPost( {
					slug: cleanForSlug( event.target.value ),
				} );
				if ( forceEmptyField ) {
					setForceEmptyField( false );
				}
			} }
			className="editor-post-slug"
		/>
	);
}

/**
 * Renders the PostSlug component. It provide a control for editing the post slug.
 *
 * @return {Component} The component to be rendered.
 */
export default function PostSlug() {
	return (
		<PostSlugCheck>
			<PostSlugControl />
		</PostSlugCheck>
	);
}
