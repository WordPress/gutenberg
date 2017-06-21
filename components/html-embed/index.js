/**
 * WordPress dependencies
 */
import { Component } from 'element';

// When embedding HTML from the WP oEmbed proxy, we need to insert it
// into a div and make sure any scripts get run. This component takes
// HTML and puts it into a div element, and creates and adds new script
// elements so all scripts get run as expected.

export default class HtmlEmbed extends Component {

	componentDidMount() {
		const body = this.node;
		const { html = '' } = this.props;

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
			<div ref={ ( node ) => this.node = node } />
		);
	}
}
