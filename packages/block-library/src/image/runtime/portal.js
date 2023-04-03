/** @jsx h */

/**
 * External dependencies
 */
import { h, Component, render } from 'preact';

/** Redirect rendering of descendants into the given CSS selector.
 *  @example
 *    <Portal into="body">
 *      <div>I am rendered into document.body</div>
 *    </Portal>
 */
export default class Portal extends Component {
	componentDidUpdate(props) {
		for (let i in props) {
			if (props[i]!==this.props[i]) {
				return setTimeout(this.renderLayer);
			}
		}
	}

	componentDidMount() {
		this.isMounted=true;
		this.renderLayer = this.renderLayer.bind(this);
		this.renderLayer();
	}

	componentWillUnmount() {
		this.renderLayer(false);
		this.isMounted=false;
		if (this.remote) this.remote.parentNode.removeChild(this.remote);
	}

	findNode(node) {
		return typeof node==='string' ? document.querySelector(node) : node;
	}

	renderLayer(show=true) {
		if (!this.isMounted) return;

		// clean up old node if moving bases:
		if (this.props.into!==this.intoPointer) {
			this.intoPointer = this.props.into;
			if (this.into && this.remote) {
				this.remote = render(<PortalProxy />, this.into, this.remote);
			}
			this.into = this.findNode(this.props.into);
		}

		this.remote = render((
			<PortalProxy context={this.context}>
				{ show && this.props.children || null }
			</PortalProxy>
		), this.into, this.remote);
	}

	render() {
		return null;
	}
}


// high-order component that renders its first child if it exists.
// used as a conditional rendering proxy.
class PortalProxy extends Component {
	getChildContext() {
		return this.props.context;
	}
	render({ children }) {
		return children || null;
	}
}
