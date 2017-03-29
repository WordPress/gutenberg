/**
 * Internal dependencies
 */
import ModeSwitcher from './mode-switcher';
import EditorText from './mode/text';
import EditorVisual from './mode/visual';

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
				<div className="editor__header">
					<ModeSwitcher mode={ mode } onSwitch={ this.switchMode } />
				</div>
				<div className="editor__body">
					{ mode === 'text' && <EditorText html={ html } onChange={ this.createChangeHandler( 'html' ) } /> }
					{ mode === 'visual' && <EditorVisual blocks={ blocks } onChange={ this.createChangeHandler( 'blocks' ) } /> }
				</div>
			</div>
		);
	}
}

export default Layout;
