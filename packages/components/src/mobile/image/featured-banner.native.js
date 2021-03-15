/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
// import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export class FeaturedBanner extends Component {
	render() {
		return (
			<View style={ styles.featuredBannerContainer }>
				<Text style={ styles.featuredBanner }>Featured</Text>
			</View>
		);
	}
}

export default FeaturedBanner;
