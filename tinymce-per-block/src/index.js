/**
 * External dependencies
 */
import { uniqueId } from 'lodash';
import { createElement, Component, render } from 'wp-elements';

/**
 * Internal dependencies
 */
import '../../shared/post-content';
import * as parsers from 'parsers';
import * as renderers from 'renderers';
import * as serializers from 'serializers';
import { getBlock } from 'wp-blocks';
import 'assets/stylesheets/main.scss';
import 'blocks/html-block';
import 'blocks/image-block';
import 'blocks/heading-block';
import 'blocks/text-block';
import 'blocks/quote-block';
import 'blocks/embed-block';

class App extends Component {
	state = {
		activeRenderer: 'block'
	};

	updateParsedContent = ( nextContent, forceType ) => {
		const type = forceType ? forceType : this.state.activeRenderer;
		switch ( type ) {
			case 'block':
				const html = serializers.block.serialize(
					nextContent.map( block => {
						const blockDefinition = getBlock( block.blockType );
						return blockDefinition.serialize( block );
					} )
				);
				this.setState( {
					content: {
						block: nextContent,
						raw: html,
						html
					}
				} );
				return;
			case 'html':
				this.setState( {
					content: {
						block: parsers.block.parse( nextContent )
							.filter( rawBlock => !! getBlock( rawBlock.blockType ) )
							.map( rawBlock => {
								const blockDefinition = getBlock( rawBlock.blockType );
								const parsedBlock = blockDefinition.parse( rawBlock );
								return parsedBlock ? parsedBlock : getBlock( 'html' ).parse( rawBlock );
							} )
							.map( block => Object.assign( { uid: uniqueId() }, block ) ),
						html: nextContent,
						raw: nextContent
					}
				} );
				return;
		}
	}

	selectRenderer = ( renderer ) => () => {
		this.setState( {
			activeRenderer: renderer
		} );
	}

	componentWillMount() {
		this.updateParsedContent( this.props.content, 'html' );
	}

	render() {
		const { content, activeRenderer } = this.state;
		const Renderer = renderers[ activeRenderer ];
		return (
			<div className="renderers">
				<div className="toggle-renderer">
					<button onClick={ this.selectRenderer( 'block' ) }>Block</button>
					<button onClick={ this.selectRenderer( 'html' ) }>Html</button>
					<button onClick={ this.selectRenderer( 'raw' ) }>Preview</button>
				</div>
				<div className={ `renderer-${ activeRenderer }` }>
					<Renderer content={ content[ activeRenderer ] } onChange={ this.updateParsedContent } />
				</div>
			</div>
		);
	}
}

render(
	<App content={ window.content } />,
	document.querySelector( '.editor' )
);
