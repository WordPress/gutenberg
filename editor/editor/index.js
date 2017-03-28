/**
 * Internal dependencies
 */
import EditorLayout from './layout';

export default class Editor {
	constructor( id, settings ) {
		this.id = id;
		this.settings = settings;
		this.render();
	}

	render() {
		wp.element.render(
			<EditorLayout initialContent={ this.settings.content } />,
			document.getElementById( this.id )
		);
	}
}
