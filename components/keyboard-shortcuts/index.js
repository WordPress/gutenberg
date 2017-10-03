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
			// Normalize callback, which can be passed as either a function or
			// an array of [ callback, isGlobal ]
			let isGlobal = false;
			if ( Array.isArray( callback ) ) {
				isGlobal = callback[ 1 ];
				callback = callback[ 0 ];
			}

			if ( isGlobal ) {
				this.mousetrap.bindGlobal( key, callback );
			} else {
				this.mousetrap.bind( key, callback );
			}
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
