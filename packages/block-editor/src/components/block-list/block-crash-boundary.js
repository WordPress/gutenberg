/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';

class BlockCrashBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			hasError: false,
		};
	}

	componentDidCatch( error, errorInfo ) {
		this.props.onError( error );

		this.setState( {
			hasError: true,
		} );

		if ( typeof this.props.errorActionName === 'string' ) {
			doAction( this.props.errorActionName, error, errorInfo );
		}
	}

	render() {
		if ( this.state.hasError ) {
			return null;
		}

		return this.props.children;
	}
}

export default BlockCrashBoundary;
