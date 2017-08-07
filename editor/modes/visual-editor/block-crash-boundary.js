/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class BlockCrashBoundary extends Component {
	componentDidCatch( error ) {
		this.props.onError( error );
	}

	render() {
		return this.props.children;
	}
}

export default BlockCrashBoundary;
