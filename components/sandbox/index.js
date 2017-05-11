/**
 * Internal dependencies
 */
import ResizableIframe from 'components/resizable-iframe';

export default class Sandbox extends wp.element.Component {

	static get defaultProps() {
		return {
			html: '',
			title: '',
		};
	}

	componentDidMount() {
		const body = this.node.getFrameBody();
		const { html } = this.props;

		body.innerHTML = html;

		// setting the inner HTML will not cause scripts to load,
		// so this prepares a bunch of new script elements and
		// appends them to the iframe's body
		const scripts = body.getElementsByTagName( 'script' );
		const newscripts = [];

		for ( let i = 0; i < scripts.length; i++ ) {
			const newscript = document.createElement( 'script' );
			newscript.src = scripts[ i ].src;
			newscripts.push( newscript );
		}

		for ( let i = 0; i < newscripts.length; i++ ) {
			body.appendChild( newscripts[ i ] );
		}
	}

	render() {
		return (
			<ResizableIframe
				sandbox="allow-same-origin allow-scripts"
				title={ this.props.title }
				ref={ ( node ) => this.node = node } />
		);
	}
}
