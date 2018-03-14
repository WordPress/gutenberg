/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

class SidebarErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = { hasError: false };
	}

	componentDidCatch() {
		this.setState( { hasError: true } );
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<p className="edit-post-plugin-sidebar__sidebar-error-boundary__message">
					{ sprintf( __( 'An error occurred rendering the plugin sidebar with id "%s".' ), this.props.pluginName ) }
				</p>
			);
		}
		return this.props.children;
	}
}

export default SidebarErrorBoundary;
