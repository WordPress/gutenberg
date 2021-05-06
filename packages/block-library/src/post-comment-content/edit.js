/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useBlockProps } from '@wordpress/block-editor';

// TODO: JSDOC types
export default function Edit( { attributes, context } ) {
	const { className } = attributes;
	const { commentId } = context;

	const [ content ] = useEntityProp(
		'root',
		'comment',
		'content',
		commentId
	);

	return (
		<div { ...useBlockProps() }>
			<p className={ className }>{ content }</p>
		</div>
	);
}
