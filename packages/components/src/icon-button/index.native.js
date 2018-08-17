/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
//import   Button from '../button';
import Dashicon from '../dashicon';
import { TouchableOpacity } from 'react-native';

// This is intentionally a Component class, not a function component because it
// is common to apply a ref to the button element (only supported in class)
class IconButton extends Component {
	render() {
		const { icon, children, label, onClick } = this.props;

		const element = (
			<TouchableOpacity
				accessible={ true }
				accessibilityLabel={ label }
				onPress={ onClick }
			>
				{ isString( icon ) ? <Dashicon icon={ icon } /> : icon }
				{ children }
			</TouchableOpacity>
		);

		return element;
	}
}

export default IconButton;
