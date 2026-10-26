import { Component } from '@wordpress/element';
import type { BlockCrashBoundaryProps } from './types';

class BlockCrashBoundary extends Component<
	BlockCrashBoundaryProps,
	{ error: Error | null }
> {
	constructor( props: BlockCrashBoundaryProps ) {
		super( props );

		this.state = {
			error: null,
		};
	}

	componentDidCatch( error: Error ) {
		this.setState( { error } );
	}

	render() {
		if ( this.state.error ) {
			return this.props.fallback( this.state.error );
		}

		return this.props.children;
	}
}

export default BlockCrashBoundary;
