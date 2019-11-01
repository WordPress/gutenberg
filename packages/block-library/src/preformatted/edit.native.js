/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import WebPreformattedEdit from './edit.js';
import styles from './styles.scss';

export default function PreformattedEdit( props ) {
	const propsWithStyle = {
		...props,
		style: styles.wpRichText,
	};
	return (
		<View style={ styles.wpBlockPreformatted } >
			<WebPreformattedEdit
				{ ...propsWithStyle }
			/>
		</View>
	);
}
