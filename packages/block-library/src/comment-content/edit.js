/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Disabled } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

export default function Edit( props ) {
	const {
		context: { commentId },
	} = props;
	useDeprecatedTextAlign( props );
	const blockProps = useBlockProps();
	const [ content ] = useEntityProp(
		'root',
		'comment',
		'content',
		commentId
	);

	if ( ! commentId || ! content ) {
		return (
			<>
				<div { ...blockProps }>
					<p>
						{ __(
							'This is the Comment Content block. It displays the text of user comments submitted on your site, ranging from short remarks to longer, multi-paragraph responses.'
						) }
					</p>
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
