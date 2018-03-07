/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement, compose } from '@wordpress/element';
import { Slot, Fill, withFocusReturn } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { withPluginContext } from '../../api/plugin';
import SidebarLayout from './sidebar-layout';
import ErrorBoundary from './error-boundary';

/**
 * Name of slot in which the sidebar should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginSidebar';

/**
 * The plugin sidebar fill.
 */
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
		if ( this.props.activePlugin !== this.namespacedName ) {
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
					<ErrorBoundary pluginName={ this.namespacedName }>
						{ cloneElement( Children.only( children ), newProps ) }
					</ErrorBoundary>
				</SidebarLayout>
			</Fill>
		);
	}
}

/**
 * The plugin sidebar slot.
 *
 * @return {ReactElement} The plugin sidebar slot.
 */
const PluginSidebarSlot = () => (
	<Slot name={ SLOT_NAME } />
);

const PluginSidebarFill = compose( [
	withSelect( select => {
		return {
			activePlugin: select( 'core/edit-post' ).getActivePlugin(),
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
