/**
 * External dependencies
 */
import { View } from 'react-native';
import Hr from 'react-native-hr';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export default class MoreEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			defaultText: __( 'Read more' ),
		};
	}

	render() {
		const { customText } = this.props.attributes;
		const { defaultText } = this.state;
		const content = customText || defaultText;

		return (
			<View>
				<Hr
					text={ content }
					marginLeft={ 0 }
					marginRight={ 0 }
					textStyle={ styles[ 'block-library-more__text' ] }
					lineStyle={ styles[ 'block-library-more__line' ] }
				/>
			</View>
		);
	}
}
