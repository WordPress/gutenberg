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
 * Name of slot in which popover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginSidebar';

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
		const { title, name, children, activePlugin } = this.props;
		return <Fill name={ SLOT_NAME }>{ children }</Fill>;
	}
}

PluginSidebar.contextTypes = {
	getSlot: noop,
};

PluginSidebar.Slot = () => <Slot name={ SLOT_NAME } />;

export default PluginSidebar;
