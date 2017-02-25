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
import 'blocks/heading-block';
import 'blocks/paragraph-block';

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
