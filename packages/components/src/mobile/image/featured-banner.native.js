/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { subscribeFeaturedImageIdChange } from '@wordpress/react-native-bridge';
// import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export class FeaturedBanner extends Component {
	constructor( props ) {
		super( props );

		this.featuredImageIdChange = this.featuredImageIdChange.bind( this );
	}

	featuredImageIdChange() {}

	// This code successfully retrieves a featured image's ID when uncommented.
	//	featuredImageIdChange( payload ) {
	//				const { featuredImageId } = this.props;
	//				console.log( 'ID from featured banner: ' + payload.featuredImageId );
	//	}

	componentDidMount() {
		this.addFeaturedImageIdListener();
	}

	componentWillUnmount() {
		this.removeFeaturedImageIdListener();
	}

	addFeaturedImageIdListener() {
		//if we already have a subscription not worth doing it again
		if ( this.subscriptionParentFeaturedImageIdChange ) {
			return;
		}
		this.subscriptionParentFeaturedImageIdChange = subscribeFeaturedImageIdChange(
			( payload ) => {
				this.featuredImageIdChange( payload );
			}
		);
	}

	removeFeaturedImageIdListener() {
		if ( this.subscriptionParentFeaturedImageIdChange ) {
			this.subscriptionParentFeaturedImageIdChange.remove();
		}
	}

	render() {
		return (
			<View>
				<Text styles={ styles.featuredBanner }>Featured</Text>
			</View>
		);
	}
}

export default FeaturedBanner;
