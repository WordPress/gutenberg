/**
 * External dependencies
 */
import { forEach } from 'lodash';
import { createElement, Component, render } from 'wp-elements';

/**
 * Internal dependencies
 */
import * as parsers from 'parsers';
import * as renderers from 'renderers';
import * as serializers from 'serializers';
import 'assets/stylesheets/main.scss';
import 'blocks/text-block';
import 'blocks/image-block';

class App extends Component {
	state = {
		activeRenderer: 'block'
	};

	updateParsedContent = ( nextContent ) => {
		if ( serializers[ this.state.activeRenderer ] ) {
			this.updateContent( serializers[ this.state.activeRenderer ].serialize( nextContent ) );
		} else {
			this.updateContent( nextContent );
		}
	}

	toggleRenderer = () => {
		this.setState( {
			activeRenderer: this.state.activeRenderer === 'block' ? 'html' : 'block'
		} );
	}

	updateContent( content ) {
		const parsedContent = {};
		forEach( renderers, ( renderer, type ) => {
			const parser = parsers[ type ];
			if ( parser ) {
				parsedContent[ type ] = parser.parse( content );
			} else {
				parsedContent[ type ] = content;
			}
		} );

		this.setState( {
			content: parsedContent
		} );
	}

	componentWillMount() {
		this.updateContent( this.props.content );
	}

	render( props, { content, activeRenderer } ) {
		const Renderer = renderers[ activeRenderer ];
		return (
			<div class="renderers">
				<button class="toggle-renderer" onClick={ this.toggleRenderer }>Html/Block</button>
				<div class={ `renderer-${ activeRenderer }` }>
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
