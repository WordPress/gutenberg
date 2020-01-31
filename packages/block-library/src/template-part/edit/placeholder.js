/**
 * WordPress dependencies
 */
import { useEntityBlockEditor, EntityProvider } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { BlockPreview } from '@wordpress/block-editor';
import { useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
import { Placeholder, TextControl, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useTemplatePartPost from './use-template-part-post';

function TemplatePartPreview() {
	const [ blocks ] = useEntityBlockEditor( 'postType', 'wp_template_part' );
	return (
		<div className="wp-block-template-part__placeholder-preview">
			<div className="wp-block-template-part__placeholder-preview-title">
				{ __( 'Preview' ) }
			</div>
			<BlockPreview blocks={ blocks } />
		</div>
	);
}

export default function TemplatePartPlaceholder( { setAttributes } ) {
	const [ slug, _setSlug ] = useState();
	const [ theme, setTheme ] = useState();
	const [ help, setHelp ] = useState();

	// Try to find an existing template part.
	const postId = useTemplatePartPost( null, slug, theme );

	// If found, get its preview.
	const preview = useSelect(
		( select ) => {
			if ( ! postId ) {
				return;
			}
			const templatePart = select( 'core' ).getEntityRecord(
				'postType',
				'wp_template_part',
				postId
			);
			if ( templatePart ) {
				return (
					<EntityProvider
						kind="postType"
						type="wp_template_part"
						id={ postId }
					>
						<TemplatePartPreview />
					</EntityProvider>
				);
			}
		},
		[ postId ]
	);

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
			<div className="wp-block-template-part__placeholder-input-container">
				<TextControl
					label={ __( 'Slug' ) }
					placeholder={ __( 'header' ) }
					value={ slug }
					onChange={ setSlug }
					help={ help }
					className="wp-block-template-part__placeholder-input"
				/>
				<TextControl
					label={ __( 'Theme' ) }
					placeholder={ __( 'twentytwenty' ) }
					value={ theme }
					onChange={ setTheme }
					className="wp-block-template-part__placeholder-input"
				/>
			</div>
			{ preview }
			<Button
				isPrimary
				disabled={ ! slug || ! theme }
				onClick={ onChooseOrCreate }
			>
				{ postId ? __( 'Choose' ) : __( 'Create' ) }
			</Button>
		</Placeholder>
	);
}
