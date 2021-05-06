/**
 * External dependencies
 */
import Hr from 'react-native-hr';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const HR = ( { getStylesFromColorScheme, ...props } ) => {
	const lineStyle = getStylesFromColorScheme( styles.line, styles.lineDark );

	return (
		<Hr
			{ ...props }
			lineStyle={ [ lineStyle, props.lineStyle ] }
			marginLeft={ 0 }
			marginRight={ 0 }
		/>
	);
};

export const HorizontalRule = withPreferredColorScheme( HR );
