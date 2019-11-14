/**
 * External dependencies
 */
import { Platform, View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { normalizeIconObject } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

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

	renderSheet( title ) {
		const { getStylesFromColorScheme } = this.props;
		const infoTextStyle = getStylesFromColorScheme( styles.infoText, styles.infoTextDark );
		const infoTitleStyle = getStylesFromColorScheme( styles.infoTitle, styles.infoTitleDark );
		const infoDescriptionStyle = getStylesFromColorScheme( styles.infoDescription, styles.infoDescriptionDark );
		const infoSheetIconStyle = getStylesFromColorScheme( styles.infoSheetIcon, styles.infoSheetIconDark );

		// translators: %s: Name of the block
		const titleFormat = Platform.OS === 'android' ? __( '\'%s\' isn\'t yet supported on WordPress for Android' ) :
			__( '\'%s\' isn\'t yet supported on WordPress for iOS' );
		const infoTitle = sprintf(
			titleFormat,
			title,
		);

		return (
			<BottomSheet
				isVisible={ this.state.showHelp }
				hideHeader
				onClose={ this.toggleSheet.bind( this ) }
			>
				<View style={ styles.infoContainer } >
					<Icon icon="editor-help" color={ infoSheetIconStyle.color } size={ styles.infoSheetIcon.size } />
					<Text style={ [ infoTextStyle, infoTitleStyle ] }>
						{ infoTitle }
					</Text>
					<Text style={ [ infoTextStyle, infoDescriptionStyle ] }>
						{ __( 'We are working hard to add more blocks with each release. In the meantime, you can also edit this post on the web.' ) }
					</Text>
				</View>
			</BottomSheet>
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
				{ this.renderSheet( title ) }
			</View>
		);
	}
}

export default withPreferredColorScheme( UnsupportedBlockEdit );
