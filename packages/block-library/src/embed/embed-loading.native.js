/**
 * External dependencies
 */
import { ActivityIndicator, View, Platform, PlatformColor } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const EmbedLoading = () => {
	const style = usePreferredColorSchemeStyle(
		styles[ 'embed-preview__loading' ],
		styles[ 'embed-preview__loading--dark' ]
	);

	const activityIndicatorColor = Platform.select( {
		ios: '#999999', // default color on iOS
		// ActivityIndicator is blank and does not show up unless explicit color prop is provided.
		// See https://github.com/facebook/react-native/pull/30057
		android: PlatformColor( '?attr/colorControlActivated' ),
	} );

	return (
		<View style={ style }>
			<ActivityIndicator animating color={ activityIndicatorColor } />
		</View>
	);
};

export default EmbedLoading;
