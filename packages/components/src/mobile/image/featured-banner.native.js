/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
// import { subscribeFeaturedImageIdChange } from '@wordpress/react-native-bridge';

export class FeaturedBanner extends Component {
	constructor( props ) {
		super( props );

		this.state = {};

		// this.featuredImageIdChange = this.featuredImageIdChange.bind( this );
	}

	// featuredImageIdChange( payload ) {}

	render() {
		return <Text></Text>;
	}
}

export default FeaturedBanner;
