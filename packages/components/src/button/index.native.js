/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';

import styles from './style.native.scss';

export default function Button( props ) {
	const { children, onClick, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed, 'data-subscript': subscript } = props;

	const buttonBorderColor = ariaPressed ? '#2e4453' : '#00000000';
	const buttonBackgroundColor = ariaPressed ? '#2e4453' : 'white';
	const subscriptColor = ariaPressed ? 'white' : '#3d596d';

	return (
		<TouchableOpacity
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			onPress={ onClick }
			style={ styles.container }
		>
			<View style={ [styles.button, { aspectRatio: 1, borderColor: buttonBorderColor, backgroundColor: buttonBackgroundColor } ] }>
				{ children }
				{ subscript && ( <Text style={ { fontVariant: [ 'small-caps' ], color: subscriptColor } }>{ subscript }</Text> ) }
			</View>
		</TouchableOpacity>
	);
}
