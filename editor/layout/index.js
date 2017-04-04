/**
 * Internal dependencies
 */
import Header from '../header';
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';

class Layout extends wp.element.Component {
	constructor( props ) {
		super( ...arguments );
		this.switchMode = this.switchMode.bind( this );
		this.state = {
			mode: 'visual',
			html: props.initialContent,
			blocks: wp.blocks.parse( this.props.initialContent )
		};
	}

	switchMode( newMode ) {
		// TODO: we need a serializer from blocks here
		const html = this.state.html;
		const blocks = this.mode === 'visual' ? this.state.blocks : wp.blocks.parse( this.state.html );
		this.setState( {
			mode: newMode,
			html,
			blocks
		} );
	}

	createChangeHandler( type ) {
		return ( value ) => this.setState( { [ type ]: value } );
	}

	render() {
		const { mode, html, blocks } = this.state;
		return (
			<div>
				<Header
					mode={ mode }
					onSwitchMode={ this.switchMode } />
				{ mode === 'text' && <TextEditor html={ html } onChange={ this.createChangeHandler( 'html' ) } /> }
				{ mode === 'visual' && <VisualEditor blocks={ blocks } onChange={ this.createChangeHandler( 'blocks' ) } /> }
			</div>
		);
	}
}

export default Layout;
