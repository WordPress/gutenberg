/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export class PluginErrorBoundary extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hasError: false,
		};
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch( error ) {
		const { name, onError } = this.props;
		if ( onError ) {
			onError( name, error );
		}
	}

	render() {
		if ( ! this.state.hasError ) {
			return this.props.children;
		}

		return null;
	}
}
