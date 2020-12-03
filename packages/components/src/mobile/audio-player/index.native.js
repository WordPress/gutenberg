/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { View } from '@wordpress/primitives';
import { Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles';
import { play, volume } from './icons';

function Slider() {
	return (
		<View style={ styles.sliderContainer }>
			<View style={ styles.sliderKnob } />
			<View style={ styles.sliderTrack } />
		</View>
	);
}

function Player( { getStylesFromColorScheme } ) {
	const containerStyle = getStylesFromColorScheme(
		styles.container,
		styles.containerDark
	);

	return (
		<View
			style={ containerStyle }
			accessible
			accessibilityLabel={ __( 'Audio Player' ) }
		>
			<View style={ styles.iconContainer }>
				<Icon icon={ play } style={ styles.icon } />
			</View>
			<Text style={ styles.timeText }>
				{
					/* translators: Audio player time marker. It will always be on 0. */
					__( '0:00' )
				}
			</Text>
			<Slider />
			<View style={ styles.iconContainer }>
				<Icon icon={ volume } style={ styles.icon } />
			</View>
		</View>
	);
}

export default withPreferredColorScheme( Player );
