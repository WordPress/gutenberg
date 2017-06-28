/**
 * Internal dependencies
 */
import ResizableIframe from 'components/resizable-iframe';

export default class Sandbox extends wp.element.Component {

	// Two phase render for sandboxed content.
	// 1) Write the html into the hidden iframe's document. This
	//    makes sure all the external content gets loaded, so
	//    we have size information for images, etc. This is needed
	//    because the MutationObserver on the resizing iframe can
	//    sometimes pick up that there's an images added to the DOM,
	//    and triggers a resize *before* the image has loaded, and so
	//    goes not get the size information, and so doesn't resize
	//    correctly. The hidden iframe is sandboxed and will not
	//    allow scripts to run, because there was a condition where
	//    scripts were running while the onLoad triggered, and we
	//    didn't get consistent information about assets.
	// 2) When the document has loaded, shift the content into the
	//    resizing iframe.
	// 3) Create new script elements where needed.

	static get defaultProps() {
		return {
			html: '',
			title: '',
		};
	}

	shiftContent() {
		const body = this.iframe.getFrameBody();
		body.innerHTML = this.props.html;
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

	componentDidMount() {
		const { html } = this.props;
		this.preRenderer.contentWindow.document.open();
		this.preRenderer.contentWindow.document.write( html );
		this.preRenderer.contentWindow.document.close();
	}

	render() {
		return (
			<div>
				<iframe
					ref={ ( node ) => this.preRenderer = node }
					style={ { display: 'none' } }
					sandbox="allow-same-origin"
					onLoad={ this.shiftContent.bind( this ) }
					title="hidden rendering content" />
				<ResizableIframe
					sandbox="allow-same-origin allow-scripts"
					title={ this.props.title }
					ref={ ( node ) => this.iframe = node } />
			</div>
		);
	}
}
