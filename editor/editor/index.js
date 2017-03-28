/**
 * Internal dependencies
 */
import EditorComponent from './editor';

export default class Editor {
	constructor( id, settings ) {
		this.toggleInserter = this.toggleInserter.bind( this );
		this.id = id;
		this.settings = settings;
		this.state = {
			inserter: { opened: false },
			blocks: wp.blocks.parse( settings.content )
		};
		console.log( this.state.blocks ); // eslint-disable-line no-console
		this.render();
	}

	setState( newState ) {
		this.state = Object.assign( {}, this.state, newState );
		this.render();
	}

	toggleInserter() {
		this.setState( {
			inserter: { opened: ! this.state.inserter.opened }
		} );
	}

	render() {
		wp.element.render(
			<EditorComponent state={ this.state} toggleInserter={ this.toggleInserter } />,
			document.getElementById( this.id )
		);
	}
}
