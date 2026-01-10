/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	PluginErrorBoundaryProps as Props,
	PluginErrorBoundaryState as State,
} from '../../types';

export class PluginErrorBoundary extends Component< Props, State > {
	constructor( props: Props ) {
		super( props );
		this.state = {
			hasError: false,
		};
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch( error: Error ): void {
		const { name, onError } = this.props;
		if ( onError ) {
			onError( name, error );
		}
	}

	render(): React.ReactNode {
		if ( ! this.state.hasError ) {
			return this.props.children;
		}

		return null;
	}
}
