/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
/**
 * Internal dependencies
 */
import styles from './body.scss';

export class PanelBody extends Component {
	constructor( ) {
		super( ...arguments );
		this.state = {};
	}

	render() {
		const { children, title, padded = true } = this.props;
		const containerStyle = padded ? styles.paddedPanelContainer : styles.panelContainer;

		return (
			<View style={ containerStyle }>
				{ title && <Text style={ styles.sectionHeaderText }>{ title }</Text> }
				{ children }
			</View>
		);
	}
}

export default PanelBody;
