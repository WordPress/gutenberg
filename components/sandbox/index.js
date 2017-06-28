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

		const scripts = body.getElementsByTagName( 'script' );
		const newScripts = Array.from( scripts ).map( ( script ) => {
			const newScript = document.createElement( 'script' );
			if ( script.src ) {
				newScript.src = script.src;
			} else {
				newScript.innerHTML = script.innerHTML;
			}
			return newScript;
		} );

		newScripts.forEach( ( script ) => body.appendChild( script ) );
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
