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

	getContainerStyle = () => {
		const { title, padded = true } = this.props;

		if ( padded && title ) {
			return styles.paddedPanelContainer;
		} else if ( padded && ! title ) {
			return [ styles.paddedPanelContainer, styles.noTitleContainer ];
		} else if ( ! padded && title ) {
			return [ styles.panelContainer ];
		}
		return [ styles.panelContainer, styles.noTitleContainer ];
	}

	render() {
		const { children, title, padded = true } = this.props;

		return (
			<View style={ this.getContainerStyle() }>
				{ title && <Text style={ styles.sectionHeaderText }>{ title }</Text> }
				{ children }
			</View>
		);
	}
}

export default PanelBody;
