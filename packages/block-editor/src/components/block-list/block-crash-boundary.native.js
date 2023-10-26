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

	componentDidCatch( error, info ) {
		this.setState( {
			hasError: true,
		} );
		// TODO: Send error to tracking service.
		console.log( { error } );
		console.log( 'Stack trace:', info.componentStack );
	}

	render() {
		if ( this.state.hasError ) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}

export default BlockCrashBoundary;
