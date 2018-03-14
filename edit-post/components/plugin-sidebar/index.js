/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement, compose } from '@wordpress/element';
import { Slot, Fill, withFocusReturn } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import './style.scss';
import SidebarLayout from './sidebar-layout';
import ErrorBoundary from './sidebar-error-boundary';

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

	/**
	 * Generates the UI plugin identifier by combining the plugin name and the sidebar name.
	 *
	 * Also registers the plugin in the plugin registry.
	 */
	componentWillMount() {
		if ( ! this.namespacedName ) {
			this.namespacedName = `${ this.props.pluginContext.namespace }/${ this.props.name }`;
		}
		this.props.pluginContext.registerUIComponent( this.namespacedName, 'sidebar' );
	}

	/**
	 * Renders the PluginSidebar component.
	 *
	 * @return {ReactElement} The rendered component.
	 */
	render() {
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

const WrappedPluginSidebar = compose( [
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

/**
 * The plugin sidebar slot.
 *
 * @return {ReactElement} The plugin sidebar slot.
 */
WrappedPluginSidebar.Slot = () => (
	<Slot name={ SLOT_NAME } />
);

export default WrappedPluginSidebar;
