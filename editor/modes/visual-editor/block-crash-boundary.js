/**
 * WordPress dependencies
 */
import { Component, Children } from '@wordpress/element';

class BlockCrashBoundary extends Component {
	componentDidCatch( error ) {
		this.props.onError( error );
	}

	render() {
		return Children.only( this.props.children );
	}
}

export default BlockCrashBoundary;
