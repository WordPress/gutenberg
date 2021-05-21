/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const BackgroundView = ( { children } ) => {
	const backgroundStyles = usePreferredColorSchemeStyle(
		styles[ 'components-autocomplete__background' ],
		styles[ 'components-autocomplete__background-dark' ]
	);

	return <View style={ backgroundStyles }>{ children }</View>;
};

export default BackgroundView;
