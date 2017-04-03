/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import './blocks';
import Layout from './layout';

/**
 * Initializes and returns an instance of Editor.
 *
 * @param {String} id   Unique identifier for editor instance
 * @param {Object} post API entity for post to edit
 */
export function createEditorInstance( id, post ) {
	wp.element.render(
		<Layout initialContent={ post.content.raw } />,
		document.getElementById( id )
	);
}
