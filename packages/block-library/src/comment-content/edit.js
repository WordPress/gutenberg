/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
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
