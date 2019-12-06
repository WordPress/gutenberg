/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon, NotificationSheet } from '@wordpress/components';
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
	constructor( props ) {
		super( props );
		this.state = { showHelp: false };
	}

	toggleSheet() {
		this.setState( {
			showHelp: ! this.state.showHelp,
		} );
	}

	renderHelpIcon() {
		const infoIconStyle = this.props.getStylesFromColorScheme( styles.infoIcon, styles.infoIconDark );

		return (
			<TouchableWithoutFeedback
				accessibilityLabel={ __( 'Help icon' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
				onPress={ this.toggleSheet.bind( this ) }
			>
				<View style={ styles.helpIconContainer } >
					<Icon
						className="unsupported-icon-help"
						label={ __( 'Help icon' ) }
						icon="editor-help"
						color={ infoIconStyle.color }
					/>
				</View>
			</TouchableWithoutFeedback>
		);
	}

	render() {
		const { originalName } = this.props.attributes;
		const { getStylesFromColorScheme, preferredColorScheme } = this.props;
		const blockType = coreBlocks[ originalName ];

		const title = blockType ? blockType.settings.title : originalName;
		const titleStyle = getStylesFromColorScheme( styles.unsupportedBlockMessage, styles.unsupportedBlockMessageDark );

		const subTitleStyle = getStylesFromColorScheme( styles.unsupportedBlockSubtitle, styles.unsupportedBlockSubtitleDark );
		const subtitle = <Text style={ subTitleStyle }>{ __( 'Unsupported' ) }</Text>;

		const icon = blockType ? normalizeIconObject( blockType.settings.icon ) : 'admin-plugins';
		const iconStyle = getStylesFromColorScheme( styles.unsupportedBlockIcon, styles.unsupportedBlockIconDark );
		const iconClassName = 'unsupported-icon' + '-' + preferredColorScheme;
		return (
			<View style={ getStylesFromColorScheme( styles.unsupportedBlock, styles.unsupportedBlockDark ) }>
				{ this.renderHelpIcon() }
				<Icon className={ iconClassName } icon={ icon && icon.src ? icon.src : icon } color={ iconStyle.color } />
				<Text style={ titleStyle }>{ title }</Text>
				{ subtitle }
				<NotificationSheet isVisible={ this.state.showHelp } onClose={ this.toggleSheet.bind( this ) } title={ title } />
			</View>
		);
	}
}

export default withPreferredColorScheme( UnsupportedBlockEdit );
