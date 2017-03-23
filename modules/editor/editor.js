import InserterButton from './inserter/button';

const h = wp.element.createElement;

const EditorComponent = ( { state: { inserter, blocks }, toggleInserter } ) => {
	return h( 'div', {},
		h( 'div', { contentEditable: true },
			wp.blocks.createBlockElement( blocks[ 1 ] )
		),
		h( InserterButton, { onClick: toggleInserter, opened: inserter.opened } )
	);
};

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
			h( EditorComponent, {
				state: this.state,
				toggleInserter: this.toggleInserter
			} ),
			document.getElementById( this.id )
		);
	}
}
