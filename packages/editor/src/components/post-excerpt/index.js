/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Renders an editable textarea for the post excerpt.
 * Templates, template parts and patterns use the `excerpt` field as a description semantically.
 * Additionally templates and template parts override the `excerpt` field as `description` in
 * REST API. So this component handles proper labeling and updating the edited entity.
 *
 * @param {Object}  props                             - Component props.
 * @param {boolean} [props.hideLabelFromVision=false] - Whether to visually hide the textarea's label.
 * @param {boolean} [props.updateOnBlur=false]        - Whether to update the post on change or use local state and update on blur.
 */
export default function PostExcerpt( {
	hideLabelFromVision = false,
	updateOnBlur = false,
} ) {
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
	const [ localExcerpt, setLocalExcerpt ] = useState( excerpt );
	const updatePost = ( value ) => {
		editPost( { [ usedAttribute ]: value } );
	};
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
				onChange={ updateOnBlur ? setLocalExcerpt : updatePost }
				onBlur={
					updateOnBlur ? () => updatePost( localExcerpt ) : undefined
				}
				value={ updateOnBlur ? localExcerpt : excerpt }
				help={
					! shouldUseDescriptionLabel ? (
						<ExternalLink
							href={ __(
								'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt'
							) }
						>
							{ __( 'Learn more about manual excerpts' ) }
						</ExternalLink>
					) : (
						__( 'Write a description' )
					)
				}
			/>
		</div>
	);
}
