/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { useBlockProps, Warning } from '@wordpress/block-editor';
import { Disabled } from '@wordpress/components';

export default function Edit( { context: { commentId } } ) {
	const blockProps = useBlockProps();
	const [ content ] = useEntityProp(
		'root',
		'comment',
		'content',
		commentId
	);

	// Show a placeholder when there is no context.
	if ( ! commentId ) {
		return (
			<div { ...blockProps }>{ __( 'The content of the comment.' ) }</div>
		);
	}

	// Show a warning message when the specified comment has no content.
	if ( ! content?.rendered ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Comment has no content.' ) }</Warning>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<Disabled>
				<RawHTML key="html">{ content.rendered }</RawHTML>
			</Disabled>
		</div>
	);
}
