/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export class PanelBody extends Component {
	constructor( ) {
		super( ...arguments );
		this.state = {};
	}

	render() {
		const { children } = this.props;
		return (
			<View >
				{ children }
			</View>
		);
	}
}

export default PanelBody;
