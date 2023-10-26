/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class BlockCrashBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			error: null,
		};
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	componentDidCatch( error, info ) {
		// TODO: Send error to tracking service.
		// eslint-disable-next-line no-console
		console.log( { error } );
		// eslint-disable-next-line no-console
		console.log( 'Stack trace:', info.componentStack );
	}

	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		return this.props.fallback;
	}
}

export default BlockCrashBoundary;
