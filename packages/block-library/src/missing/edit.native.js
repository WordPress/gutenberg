/**
 * External dependencies
 */
import { Platform, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { normalizeIconObject } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const isAndroid = Platform.OS === 'android';
const platformText = isAndroid ? 'Android' : 'iOS';
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
		return <View style={ styles.helpIconContainer } >
			<Icon
				className="unsupported-icon-help"
				label={ __( 'Help icon' ) }
				icon="editor-help"
			/>
		</View>;
	}

	renderSheetButton( text, action ) {
		// This margin is necessary for Android because of the way the modals on each platform are
		// being rendered. This extra margin makes the modals look the same on each platform.
		const marginBottom = isAndroid ? 16 : 0;
		return <TouchableOpacity
			onPress={ action() }
			style={ [ styles.infoButton, { marginBottom } ] }
		>
			<Text style={ styles.infoButtonText } >{ text }</Text>
		</TouchableOpacity>;
	}

	renderSheet() {
		return <BottomSheet
			isVisible={ this.state.showHelp }
			hideHeader
			onClose={ this.toggleSheet.bind( this ) }
		>
			<View style={ styles.infoContainer } >
				<Icon icon="editor-help" style={ styles.infoIcon } size={ styles.infoIcon.size } />
				<Text style={ [ styles.infoText, styles.infoTitle ] }>
					{ __( 'This block isn\'t yet supported on WordPress for ' + platformText ) }
				</Text>
				<Text style={ [ styles.infoText, styles.infoDescription ] }>
					{ __( 'We are working hard to add more blocks with each release. In the meantime, you can also edit this post on the web.' ) }
				</Text>
				{ this.renderSheetButton( __( 'Edit in Safari' ), () => this.toggleSheet.bind( this ) ) }
				{ this.renderSheetButton( __( 'Close' ), () => this.toggleSheet.bind( this ) ) }
			</View>
		</BottomSheet>;
	}

	render() {
		const { originalName } = this.props.attributes;
		const { getStylesFromColorScheme, preferredColorScheme } = this.props;
		const blockType = coreBlocks[ originalName ];

		const title = blockType ? blockType.settings.title : originalName;
		const titleStyle = getStylesFromColorScheme( styles.unsupportedBlockMessage, styles.unsupportedBlockMessageDark );

		const icon = blockType ? normalizeIconObject( blockType.settings.icon ) : 'admin-plugins';
		const iconStyle = getStylesFromColorScheme( styles.unsupportedBlockIcon, styles.unsupportedBlockIconDark );
		const iconClassName = 'unsupported-icon' + '-' + preferredColorScheme;
		return (
			<TouchableWithoutFeedback
				accessibilityLabel={ __( originalName + ' block' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap the top right corner to show help' ) }
				onPress={ this.toggleSheet.bind( this ) }
			>
				<View style={ getStylesFromColorScheme( styles.unsupportedBlock, styles.unsupportedBlockDark ) }>
					{ this.renderHelpIcon() }
					<Icon className={ iconClassName } icon={ icon && icon.src ? icon.src : icon } color={ iconStyle.color } />
					<Text style={ titleStyle }>{ title }</Text>
					{ this.renderSheet() }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default withPreferredColorScheme( UnsupportedBlockEdit );
