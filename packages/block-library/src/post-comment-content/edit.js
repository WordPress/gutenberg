/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Disabled } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Renders the `core/post-comment-content` block on the editor.
 *
 * @param {Object} props                      React props.
 * @param {Object} props.setAttributes        Callback for updating block attributes.
 * @param {Object} props.attributes           Block attributes.
 * @param {string} props.attributes.textAlign The `textAlign` attribute.
 * @param {Object} props.context              Inherited context.
 * @param {string} props.context.commentId    The comment ID.
 *
 * @return {JSX.Element} React element.
 */
export default function Edit( {
	setAttributes,
	attributes: { textAlign },
	context: { commentId },
} ) {
	// Generate the block props adding extra classes.
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	// Get the comment content from the core store.
	const [ content ] = useEntityProp(
		'root',
		'comment',
		'content',
		commentId
	);

	return (
		<>
			{ /* Add controls to handle text alignment. */ }
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( newAlign ) =>
						setAttributes( { textAlign: newAlign } )
					}
				/>
			</BlockControls>
			<div { ...blockProps }>
				{ ! commentId ? (
					// Show a sample text when there is no `commentId` in the context.
					<p>{ __( 'The content of the comment.' ) }</p>
				) : (
					// Render the comment content. Note that the parent block is
					// responsible for showing a warning message if the comment does not
					// exist. The optional chaining operator is used just to avoid
					// possible errors related to a missing comment.
					<Disabled>
						<RawHTML key="html">{ content?.rendered }</RawHTML>
					</Disabled>
				) }
			</div>
		</>
	);
}
