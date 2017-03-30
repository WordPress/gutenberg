/**
 * Internal dependencies
 */
import EditorLayout from './layout';

export default class Editor {
	constructor( id, post ) {
		this.id = id;
		this.post = post;
		this.render();
	}

	render() {
		wp.element.render(
			<EditorLayout initialContent={ this.post.content.raw } />,
			document.getElementById( this.id )
		);
	}
}
