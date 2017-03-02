/**
 * External dependencies
 */
import { uniqueId } from 'lodash';
import { createElement, Component, render } from 'wp-elements';

/**
 * Internal dependencies
 */
import * as parsers from 'parsers';
import * as renderers from 'renderers';
import * as serializers from 'serializers';
import { getBlock } from 'wp-blocks';
import 'assets/stylesheets/main.scss';
import 'blocks/text-block';
import 'blocks/image-block';
import 'blocks/heading-block';
import 'blocks/paragraph-block';
import 'blocks/quote-block';

class App extends Component {
	state = {
		activeRenderer: 'block'
	};

	updateParsedContent = ( nextContent, forceType ) => {
		const type = forceType ? forceType : this.state.activeRenderer;
		switch ( type ) {
			case 'block':
				this.setState( {
					content: {
						block: nextContent,
						html: serializers.block.serialize( nextContent )
					}
				} );
				return;
			case 'html':
				this.setState( {
					content: {
						block: parsers.block.parse( nextContent )
							.filter( block => !! getBlock( block.blockType ) )
							.map( block => Object.assign( { uid: uniqueId() }, block ) ),
						html: nextContent
					}
				} );
				return;
		}
	}

	toggleRenderer = () => {
		this.setState( {
			activeRenderer: this.state.activeRenderer === 'block' ? 'html' : 'block'
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
				<button className="toggle-renderer" onClick={ this.toggleRenderer }>Html/Block</button>
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
