/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class KeyboardShortcuts extends Component {
	componentWillMount() {
		this.mousetrap = new Mousetrap;
		forEach( this.props.shortcuts, ( callback, key ) => {
			this.mousetrap.bind( key, callback );
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
