/**
 * External dependencies
 */
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement } from '@wordpress/element';
import { Slot, Fill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Name of slot in which popover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginSidebar';

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
			return <p className="plugin-sidebar-error">
				{ __( 'An error occurred rendering the plugin sidebar.' ) }
			</p>;
		}
		return this.props.children;
	}
}

class PluginSidebar extends Component {
	constructor( props ) {
		super( props );

		if ( typeof props.name !== 'string' ) {
			throw 'Sidebar names must be strings.';
		}
		if ( ! /^[a-z][a-z0-9-]*$/.test( props.name ) ) {
			throw 'Sidebar names must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-sidebar".';
		}
	}

	render() {
		const { children, ...props } = this.props;
		const newProps = {
			...props,
			namespacedName: `${ this.context.namespace }/${ this.props.name }`,
		};

		return (
			<Fill name={ SLOT_NAME }>
				{ cloneElement( Children.only( children ), newProps ) }
			</Fill>
		);
	}
}

PluginSidebar.contextTypes = {
	namespace: PropTypes.string.isRequired,
};

PluginSidebar.Slot = () => ( <SidebarErrorBoundary><Slot name={ SLOT_NAME } /></SidebarErrorBoundary> );

export default PluginSidebar;
