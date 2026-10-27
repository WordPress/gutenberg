import { Component } from '@wordpress/element';
import type { BlockCrashBoundaryProps } from './types';

class BlockCrashBoundary extends Component<
	BlockCrashBoundaryProps,
	{ hasError: boolean }
> {
	constructor( props: BlockCrashBoundaryProps ) {
		super( props );

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
