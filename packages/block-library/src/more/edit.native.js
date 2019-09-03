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
import { withTheme } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export class MoreEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			defaultText: __( 'Read more' ),
		};
	}

	render() {
		const { attributes, useStyle } = this.props;
		const { customText } = attributes;
		const { defaultText } = this.state;

		const content = customText || defaultText;
		const textStyle = useStyle( styles.moreText, styles.moreTextDark );
		const lineStyle = useStyle( styles.moreLine, styles.moreLineDark );

		return (
			<View>
				<Hr
					text={ content }
					marginLeft={ 0 }
					marginRight={ 0 }
					textStyle={ textStyle }
					lineStyle={ lineStyle }
				/>
			</View>
		);
	}
}

export default withTheme( MoreEdit );
