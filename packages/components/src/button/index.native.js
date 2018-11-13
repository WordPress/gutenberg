/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';

import styles from './button-style.scss';

export default function Button( props ) {
	const { children, onClick, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed, 'data-subscript': subscript } = props;

	const buttonBorderColor = ariaPressed ? '#a8bece' : '#00000000';
	const buttonBackgroundColor = ariaPressed ? '#F9FBFC' : 'white';

	return (
		<TouchableOpacity
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			onPress={ onClick }
			style={ styles.container }
		>
			<View style={ [styles.button, { aspectRatio: 1, borderColor: buttonBorderColor, backgroundColor: buttonBackgroundColor } ] }>
				{ children }
				{ subscript && ( <Text style={ { fontVariant: [ 'small-caps' ], color: '#3d596d' } }>{ subscript }</Text> ) }
			</View>
		</TouchableOpacity>
	);
}
