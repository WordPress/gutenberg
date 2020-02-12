/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { postList as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class LatestPostsEdit extends Component {
	render() {
		const { getStylesFromColorScheme, name } = this.props;
		const blockType = coreBlocks[ name ];

		const blockStyle = getStylesFromColorScheme(
			styles.latestPostBlock,
			styles.latestPostBlockDark
		);

		const iconStyle = getStylesFromColorScheme(
			styles.latestPostBlockIcon,
			styles.latestPostBlockIconDark
		);

		const titleStyle = getStylesFromColorScheme(
			styles.latestPostBlockMessage,
			styles.latestPostBlockMessageDark
		);

		const subTitleStyle = getStylesFromColorScheme(
			styles.latestPostBlockSubtitle,
			styles.latestPostBlockSubtitleDark
		);

		return (
			<View style={ blockStyle }>
				<Icon icon={ icon } { ...iconStyle } />
				<Text style={ titleStyle }>{ blockType.settings.title }</Text>
				<Text style={ subTitleStyle }>{ __( 'Configure' ) }</Text>
			</View>
		);
	}
}

export default withPreferredColorScheme( LatestPostsEdit );
