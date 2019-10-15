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
		const { children, title } = this.props;

		return (
			<View style={ styles.panelContainer }>
				{ title && <Text style={ styles.sectionHeaderText }>{ title }</Text> }
				{ children }
			</View>
		);
	}
}

export default PanelBody;
