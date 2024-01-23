/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import ErrorBoundaryWarning from './warning';

export default class ErrorBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			error: null,
		};
	}

	componentDidCatch( error ) {
		doAction( 'editor.ErrorBoundary.errorLogged', error );
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	render() {
		if ( ! this.state.error ) {
			return this.props.children;
		}

		return (
			<ErrorBoundaryWarning
				message={ __(
					'The editor has encountered an unexpected error.'
				) }
				error={ this.state.error }
			/>
		);
	}
}
