/**
 * Internal dependencies
 */
import ResizableIframe from 'components/resizable-iframe';

export default class Sandbox extends wp.element.Component {

	// Two phase render for sandboxed content.
    //
	// 1) Render the document into a hidden iframe,
	//    with scripts disabled.
	//
	//    This makes sure all initial assets are loaded and we
	//    have all size information for the initial render
	//    in the ResizableIframe. Scripts may add, delete,
	//    or otherwise mess with the initial assets, and
	//    we need everything fully loaded to make sure the
	//    ResizableIframe has all size information as soon
	//    as it renders.
	//
	//    This stop scenarios like this:
	//
	//      * ResizableIframe gets an img node added to the DOM
	//      * MutationObserver says, "Hey, I have a new node! Please resize!",
	//        but the img has not loaded, so the dimensions are 0,0
	//      * ResizableIframe resizes, but to 0,0
	//      * Image loads, and is hidden because the iframe is 0,0
	//
	//    Instead, we are certain that all initial assets are loaded
	//    and the iframe resizes correctly when it gets the initial
	//    state of the document.
	//
	// 2) When the document has been pre-rendered (all assets loaded)
	//    the onLoad triggers and renders into the ResizableIframe.

	static get defaultProps() {
		return {
			html: '',
			title: '',
		};
	}

	shiftContent() {
		const body = this.iframe.getFrameBody();
		body.innerHTML = this.props.html;

		// recreate script elements so they get executed
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
