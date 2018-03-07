/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement, compose } from '@wordpress/element';
import { Slot, Fill, withFocusReturn } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { withPluginContext } from '../../api/plugin';
import SidebarLayout from './sidebar-layout';

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
			this.namespacedName = `${ this.props.pluginContext.namespace }/${ this.props.name }`;
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
				<SidebarLayout
					title={ props.title }
					onClose={ props.onClose } >
					{ cloneElement( Children.only( children ), newProps ) }
				</SidebarLayout>
			</Fill>
		);
	}
}

const PluginSidebarSlot = () => ( <SidebarErrorBoundary><Slot name={ SLOT_NAME } /></SidebarErrorBoundary> );

const PluginSidebarFill = compose( [
	withSelect( select => {
		return {
			activePlugin: select( 'core/edit-post' ).getActiveGeneralSidebarName(),
		};
	} ),
	withDispatch( dispatch => {
		return {
			onClose: dispatch( 'core/edit-post' ).closeGeneralSidebar,
		};
	} ),
	withFocusReturn,
	withPluginContext,
] )( PluginSidebar );

export { PluginSidebarFill, PluginSidebarSlot as PluginSidebar };
