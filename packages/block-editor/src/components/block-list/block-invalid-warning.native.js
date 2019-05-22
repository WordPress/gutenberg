/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './invalid-content-style.scss';

export default class BlockInvalidWarning extends Component {
	render() {
		const title = __( 'Problem displaying block' );
		return (
			<View style={ styles.invalidBlock }
				accessible={ true }
				accessibilityLabel={ title }
				onAccessibilityTap={ this.props.onFocus }
			>
				<Text style={ styles.invalidBlockMessage }>{ title }</Text>
			</View>
		);
	}
}
