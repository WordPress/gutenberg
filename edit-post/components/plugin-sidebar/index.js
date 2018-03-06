/**
 * External dependencies
 */
import { noop } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Slot, Fill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getActivePlugin } from '../../store/selectors';

/**
 * Name of slot in which popover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginSidebar';

//TODO Error boundaries

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
		const { children } = this.props;
		return <Fill name={ SLOT_NAME }>{ children }</Fill>;
	}
}

PluginSidebar.contextTypes = {
	plugin: noop,
};

PluginSidebar.Slot = () => <Slot name={ SLOT_NAME } />;

export default connect( ( state ) => ( {
	activePlugins: getActivePlugin( state ),
} ) )( PluginSidebar );
