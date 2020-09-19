/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';

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

	return <p className={ className }>{ content }</p>;
}
