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
import { normalizeIconObject } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export class UnsupportedBlockEdit extends Component {
	render() {
		const { originalName } = this.props.attributes;
		const { getStylesFromColorScheme, preferredColorScheme } = this.props;
		const blockType = coreBlocks[ originalName ];

		const title = blockType ? blockType.settings.title : __( 'Unsupported' );
		const titleStyle = getStylesFromColorScheme( styles.unsupportedBlockMessage, styles.unsupportedBlockMessageDark );

		const icon = blockType ? normalizeIconObject( blockType.settings.icon ) : 'admin-plugins';
		const iconStyle = getStylesFromColorScheme( styles.unsupportedBlockIcon, styles.unsupportedBlockIconDark );
		const iconClassName = 'unsupported-icon' + '-' + preferredColorScheme;
		return (
			<View style={ getStylesFromColorScheme( styles.unsupportedBlock, styles.unsupportedBlockDark ) }>
				<Icon className={ iconClassName } icon={ icon && icon.src ? icon.src : icon } color={ iconStyle.color } />
				<Text style={ titleStyle }>{ title }</Text>
			</View>
		);
	}
}

export default withPreferredColorScheme( UnsupportedBlockEdit );
