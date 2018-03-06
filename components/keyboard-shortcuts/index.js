/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class KeyboardShortcuts extends Component {
	componentWillMount() {
		this.mousetrap = new Mousetrap;
		forEach( this.props.shortcuts, ( callback, key ) => {
			const { bindGlobal, eventName } = this.props;
			const bindFn = bindGlobal ? 'bindGlobal' : 'bind';
			this.mousetrap[ bindFn ]( key, callback, eventName );
		} );
	}

	componentWillUnmount() {
		this.mousetrap.reset();
	}

	render() {
		return null;
	}
}

export default KeyboardShortcuts;
