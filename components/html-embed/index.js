/***
 * When embedding HTML from the WP oEmbed proxy, we need to insert it
 * into a div and make sure any scripts get run. This component takes
 * HTML and puts it into a div element, and creates and adds new script
 * elements so all scripts get run as expected.
 */
export default class HtmlEmbed extends wp.element.Component {

	static get defaultProps() {
		return {
			html: '',
		};
	}

	componentDidMount() {
		const body = this.node;
		const { html } = this.props;

		body.innerHTML = html;

		const scripts = body.getElementsByTagName( 'script' );
		const newscripts = [];

		for ( let i = 0; i < scripts.length; i++ ) {
			const newscript = document.createElement( 'script' );
			if ( scripts[ i ].src ) {
				newscript.src = scripts[ i ].src;
			} else {
				newscript.innerHTML = scripts[ i ].innerHTML;
			}
			newscripts.push( newscript );
		}
		for ( let i = 0; i < newscripts.length; i++ ) {
			body.appendChild( newscripts[ i ] );
		}
	}

	render() {
		return (
			<div ref={ ( node ) => this.node = node } />
		);
	}
}
