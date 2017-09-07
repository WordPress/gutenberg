/**
 * External dependencies
 */
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class PopoverProvider extends Component {
	render() {
		return (
			<div>
				<div><Slot name="Popover" /></div>
				<div>{ this.props.children }</div>
			</div>
		);
	}
}

export default PopoverProvider;
