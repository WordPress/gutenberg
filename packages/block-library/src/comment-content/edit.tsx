import { _x } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Disabled } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useBlockProps } from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';
import type {
	CommentContentAttributes,
	CommentContentBlockContext,
} from './types';

export default function Edit(
	props: BlockEditProps< CommentContentAttributes > & {
		context: CommentContentBlockContext;
	}
) {
	const {
		context: { commentId },
	} = props;
	useDeprecatedTextAlign( props );
	const blockProps = useBlockProps();
	const [ content ] = useEntityProp< Comment[ 'content' ] >(
		'root',
		'comment',
		'content',
		commentId
	);

	if ( ! commentId || ! content ) {
		return (
			<>
				<div { ...blockProps }>
					<p>{ _x( 'Comment Content', 'block title' ) }</p>
				</div>
			</>
		);
	}

	return (
		<>
			<div { ...blockProps }>
				<Disabled>
					<RawHTML key="html">{ content.rendered }</RawHTML>
				</Disabled>
			</div>
		</>
	);
}
