/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

class KeyboardShortcuts extends Component {
	componentWillMount() {
		this.toggleBindings( true );
	}

	componentWillUnmount() {
		this.toggleBindings( false );
	}

	toggleBindings( isActive ) {
		forEach( this.props.shortcuts, ( callback, key ) => {
			if ( isActive ) {
				Mousetrap.bind( key, callback );
				return;
			}
			Mousetrap.unbind( key );
		} );
	}

	render() {
		return null;
	}
}

export default KeyboardShortcuts;
