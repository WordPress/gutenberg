/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/components';
/**
 * Error boundary to catch errors in modal content.
 */
export default class ModalErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError( error ) {
		return { hasError: true, error };
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<Text>
					{ this.state.error?.message ||
						__( 'Error loading modal content.' ) }
				</Text>
			);
		}

		return this.props.children;
	}
}
