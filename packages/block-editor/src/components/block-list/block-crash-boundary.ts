import { Component } from '@wordpress/element';
import type { BlockCrashBoundaryProps } from './types';

class BlockCrashBoundary extends Component<
	BlockCrashBoundaryProps,
	{ hasError: boolean; error: Error | null }
> {
	constructor( props: BlockCrashBoundaryProps ) {
		super( props );

		this.state = {
			hasError: false,
			error: null,
		};
	}

	// Anything can be thrown, including falsy values such as `null` or `0`,
	// so track that an error was caught apart from the value itself.
	componentDidCatch( error: unknown ) {
		this.setState( {
			hasError: true,
			error:
				error instanceof Error ? error : new Error( String( error ) ),
		} );
	}

	render() {
		if ( this.state.hasError ) {
			return this.props.fallback( this.state.error as Error );
		}

		return this.props.children;
	}
}

export default BlockCrashBoundary;
