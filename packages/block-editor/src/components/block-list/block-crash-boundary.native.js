/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { logException } from '@wordpress/react-native-bridge';

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

	componentDidCatch( error ) {
		const { blockName } = this.props;

		logException( error, {
			context: {
				component_stack: error.componentStack,
				error_boundary_level: 'block',
				block_name: blockName,
			},
		} );
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
