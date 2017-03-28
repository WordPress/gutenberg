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
		this.changeHtml = this.changeHtml.bind( this );
		this.changeBlocks = this.changeBlocks.bind( this );
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

	changeHtml( html ) {
		this.setState( {
			html
		} );
	}

	changeBlocks( blocks ) {
		this.setState( {
			blocks
		} );
	}

	render() {
		const { mode, html, blocks } = this.state;
		return (
			<div>
				<div className="editor__header">
					<ModeSwitcher mode={ mode } onSwitch={ this.switchMode } />
				</div>
				<div className="editor__body">
					{ mode === 'text' && <EditorText html={ html } onChange={ this.changeHtml } /> }
					{ mode === 'visual' && <EditorVisual blocks={ blocks } onChange={ this.changeBlocks } /> }
				</div>
			</div>
		);
	}
}

export default Layout;
