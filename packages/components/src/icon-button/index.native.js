/**
 * External dependencies
 */
import classnames from 'classnames';
import { isString, isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
//import   Button from '../button';
import Dashicon from '../dashicon';
import { TouchableOpacity, Text, View } from 'react-native';

// This is intentionally a Component class, not a function component because it
// is common to apply a ref to the button element (only supported in class)
class IconButton extends Component {
	render() {
		const { icon, children, label, className, tooltip, focus, shortcut, onClick, ...additionalProps } = this.props;
		const classes = classnames( 'components-icon-button', className );		
		
		let element = (
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
