/**
 * External dependencies
 */
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement, compose } from '@wordpress/element';
import { Slot, Fill, IconButton, withFocusReturn } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { getActiveGeneralSidebarName } from '../../store/selectors';
import { closeGeneralSidebar } from '../../store/actions';

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
		if ( ! this.namespacedName ) {
			this.namespacedName = `${ this.context.namespace }/${ this.props.name }`;
		}
		if ( this.props.openedGeneralSidebar !== this.namespacedName ) {
			return null;
		}

		const { children, ...props } = this.props;
		const newProps = {
			...props,
			namespacedName: this.namespacedName,
		};

		return (
			<Fill name={ SLOT_NAME }>
				<div
					className="edit-post-sidebar edit-post-plugins-panel"
					role="region"
					aria-label={ __( 'Editor plugins' ) }
					tabIndex="-1">
					<div className="edit-post-plugins-panel__header">
						<h3>{ this.props.title }</h3>
						<IconButton
							onClick={ this.props.onClose }
							icon="no-alt"
							label={ __( 'Close settings' ) }
						/>
					</div>
					<div className="edit-post-plugins-panel__content">
						{ cloneElement( Children.only( children ), newProps ) }
					</div>
				</div>
			</Fill>
		);
	}
}

PluginSidebar.contextTypes = {
	namespace: PropTypes.string.isRequired,
};

const PluginSidebarSlot = () => ( <SidebarErrorBoundary><Slot name={ SLOT_NAME } /></SidebarErrorBoundary> );

const PluginSidebarFill = compose( [
	connect(
		( state ) => ( {
			openedGeneralSidebar: getActiveGeneralSidebarName( state ),
		} ), {
			onClose: closeGeneralSidebar,
		},
		null,
		{ storeKey: 'edit-post' } ),
	withFocusReturn,
] )( PluginSidebar );

export { PluginSidebarFill, PluginSidebarSlot };
