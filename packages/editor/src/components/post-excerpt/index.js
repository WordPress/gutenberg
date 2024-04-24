/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostExcerpt( { hideLabelFromVision = false } ) {
	const { excerpt, shouldUseDescriptionLabel, usedAttribute } = useSelect(
		( select ) => {
			const { getCurrentPostType, getEditedPostAttribute } =
				select( editorStore );
			const postType = getCurrentPostType();
			// This special case is unfortunate, but the REST API of wp_template and wp_template_part
			// support the excerpt field throught the "description" field rather than "excerpt".
			const _usedAttribute = [
				'wp_template',
				'wp_template_part',
			].includes( postType )
				? 'description'
				: 'excerpt';
			return {
				excerpt: getEditedPostAttribute( _usedAttribute ),
				// There are special cases where we want to label the excerpt as a description.
				shouldUseDescriptionLabel: [
					'wp_template',
					'wp_template_part',
					'wp_block',
				].includes( postType ),
				usedAttribute: _usedAttribute,
			};
		},
		[]
	);
	const { editPost } = useDispatch( editorStore );

	const label = shouldUseDescriptionLabel
		? __( 'Write a description (optional)' )
		: __( 'Write an excerpt (optional)' );

	return (
		<div className="editor-post-excerpt">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
				className="editor-post-excerpt__textarea"
				onChange={ ( value ) =>
					editPost( { [ usedAttribute ]: value } )
				}
				value={ excerpt }
				help={
					! shouldUseDescriptionLabel && (
						<ExternalLink
							href={ __(
								'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt'
							) }
						>
							{ __( 'Learn more about manual excerpts' ) }
						</ExternalLink>
					)
				}
			/>
		</div>
	);
}

export default PostExcerpt;
