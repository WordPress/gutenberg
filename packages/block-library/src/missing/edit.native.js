/**
 * External dependencies
 */
import { Platform, View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, Button, Icon, IconButton } from '@wordpress/components';
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
			<IconButton
				className="unsupported-icon-help"
				label={ __( 'Help icon' ) }
				onClick={ this.toggleSheet.bind( this ) }
				icon="editor-help"
			/>
		</View>;
	}

	renderSheet() {
		return <BottomSheet
			isVisible={ this.state.showHelp }
			hideHeader={ true }
			onClose={ this.toggleSheet.bind( this ) }
			contentStyle={ styles.content }
		>
			<Icon icon="info-outline" style={ styles.infoIcon } size={ styles.infoIcon.size } />
			<Text style={ styles.infoTitle }>
				{ __( 'This block isn\'t yet supported on WordPress for ' + platformText ) }
			</Text>
			<Button
				onClick={ this.toggleSheet.bind( this ) }
				fixedRatio={ false }
			>
				<View style={ styles.infoCloseButton } >
					<Text style={ styles.infoCloseButtonText } >
						{ __( 'Close' ) }
					</Text>
				</View>
			</Button>
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
			<View style={ getStylesFromColorScheme( styles.unsupportedBlock, styles.unsupportedBlockDark ) }>
				{ this.renderHelpIcon() }
				<Icon className={ iconClassName } icon={ icon && icon.src ? icon.src : icon } color={ iconStyle.color } />
				<Text style={ titleStyle }>{ title }</Text>
				{ this.renderSheet() }
			</View>
		);
	}
}

export default withPreferredColorScheme( UnsupportedBlockEdit );
