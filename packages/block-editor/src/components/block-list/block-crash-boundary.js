/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class BlockCrashBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			hasError: false,
		};
	}

	componentDidCatch() {
		this.setState( {
			hasError: true,
		} );
	}

	render() {
		if ( this.state.hasError ) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}

export default BlockCrashBoundary;
