/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { cleanForSlug } from '@wordpress/editor';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Placeholder, TextControl, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useTemplatePartPost from './use-template-part-post';

export default function TemplatePartPlaceholder( { setAttributes } ) {
	const [ slug, _setSlug ] = useState();
	const [ theme, setTheme ] = useState();
	const [ help, setHelp ] = useState();

	// Try to find an existing template part.
	const postId = useTemplatePartPost( null, slug, theme );

	const setSlug = useCallback( ( nextSlug ) => {
		_setSlug( nextSlug );
		setHelp( cleanForSlug( nextSlug ) );
	}, [] );

	const { saveEntityRecord } = useDispatch( 'core' );
	const onChooseOrCreate = useCallback( async () => {
		const nextAttributes = { slug, theme };
		if ( postId !== undefined && postId !== null ) {
			// Existing template part found.
			nextAttributes.postId = postId;
		} else {
			// Create a new template part.
			try {
				const cleanSlug = cleanForSlug( slug );
				const templatePart = await saveEntityRecord(
					'postType',
					'wp_template_part',
					{
						title: cleanSlug,
						status: 'publish',
						slug: cleanSlug,
						meta: { theme },
					}
				);
				nextAttributes.postId = templatePart.id;
			} catch ( err ) {
				setHelp( __( 'Error adding template.' ) );
			}
		}
		setAttributes( nextAttributes );
	}, [ postId, slug, theme ] );
	return (
		<Placeholder
			icon="layout"
			label={ __( 'Template Part' ) }
			instructions={ __(
				'Choose a template part by slug and theme, or create a new one.'
			) }
		>
			<TextControl
				label={ __( 'Slug' ) }
				placeholder={ __( 'header' ) }
				value={ slug }
				onChange={ setSlug }
				help={ help }
			/>
			<TextControl
				label={ __( 'Theme' ) }
				placeholder={ __( 'twentytwenty' ) }
				value={ theme }
				onChange={ setTheme }
			/>
			<Button isPrimary disabled={ ! slug || ! theme } onClick={ onChooseOrCreate }>
				{ postId ? __( 'Choose' ) : __( 'Create' ) }
			</Button>
		</Placeholder>
	);
}
