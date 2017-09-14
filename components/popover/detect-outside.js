/**
 * WordPress dependencies
 */
import { Component, Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WithClickOutside from '../higher-order/with-click-outside';

class PopoverDetectOutside extends Component {
	handleClickOutside( event ) {
		const { onClickOutside } = this.props;
		if ( onClickOutside ) {
			onClickOutside( event );
		}
	}

	render() {
		return Children.only( this.props.children );
	}
}

export default WithClickOutside( PopoverDetectOutside );
