/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useBlockProps, Warning } from '@wordpress/block-editor';
import { Icon, Disabled } from '@wordpress/components';
import { commentContent } from '@wordpress/icons';

/**
 * Renders the `core/post-comment-content` block on the editor.
 *
 * @param {Object} props                   React props.
 * @param {Object} props.context           Inherited context.
 * @param {string} props.context.commentId The comment ID.
 *
 * @return {import('react').ReactNode} React element.
 */
export default function Edit( { context: { commentId } } ) {
	const blockProps = useBlockProps();

	// Get the comment using a custom selector. This allows us to
	// check whether the comment is still loading or ready.
	const { comment, isLoading } = useSelect(
		( select ) => {
			const { getEntityRecord, hasFinishedResolution } = select(
				coreStore
			);
			const queryArgs = [ 'root', 'comment', commentId ];
			return {
				comment: getEntityRecord( ...queryArgs ),
				isLoading: ! hasFinishedResolution(
					'getEntityRecord',
					queryArgs
				),
			};
		},
		[ commentId ]
	);

	// Show a placeholder chip if the comment is not ready yet.
	if ( isLoading ) {
		return (
			<div { ...blockProps }>
				<Icon icon={ commentContent } />
				<p> { __( 'Comment Content' ) }</p>
			</div>
		);
	}

	// Show a sample text when there is no `commentId` in the context.
	if ( ! commentId ) {
		return (
			<div { ...blockProps }>{ __( 'The content of the comment.' ) }</div>
		);
	}

	// Show a warning message when the comment does not exist.
	if ( ! comment ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'The specified comment does not exist.' ) }
				</Warning>
			</div>
		);
	}

	// At this point, comment should exist and have a content attribute.
	// Using the optional chaining operator just to avoid possible errors.
	return (
		<div { ...blockProps }>
			<Disabled>
				<RawHTML key="html">{ comment.content?.rendered }</RawHTML>
			</Disabled>
		</div>
	);
}
