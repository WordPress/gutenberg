/**
 * WordPress dependencies
 */
import ServerSideRender from '@wordpress/server-side-render';

// TODO: JSDOC types
export default function Edit( { attributes, context } ) {
	const { className } = attributes;
	const { commentId } = context;

	return (
		<p className={ className }>
			<ServerSideRender
				block="core/post-comment-author"
				attributes={ { commentId } }
			/>
		</p>
	);
}
