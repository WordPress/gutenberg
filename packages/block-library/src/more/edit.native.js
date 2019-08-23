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
import { withTheme, useStyle } from '@wordpress/components';

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
		const { customText } = this.props.attributes;
		const { defaultText } = this.state;
		const content = customText || defaultText;
		const textStyle = useStyle( styles.moreText, styles.moreTextDark, this.props.theme );
		const lineStyle = useStyle( styles.moreLine, styles.moreLineDark, this.props.theme );

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
