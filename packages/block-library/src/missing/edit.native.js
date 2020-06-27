/**
 * External dependencies
 */
import { Platform, View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { requestUnsupportedBlockFallback } from '@wordpress/react-native-bridge';
import { BottomSheet, Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { normalizeIconObject } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { help, plugins } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export class UnsupportedBlockEdit extends Component {
	constructor( props ) {
		super( props );
		this.state = { showHelp: false };
		this.toggleSheet = this.toggleSheet.bind( this );
		this.requestFallback = this.requestFallback.bind( this );
	}

	toggleSheet() {
		this.setState( {
			showHelp: ! this.state.showHelp,
		} );
	}

	componentWillUnmount() {
		if ( this.timeout ) {
			clearTimeout( this.timeout );
		}
	}

	renderHelpIcon() {
		const infoIconStyle = this.props.getStylesFromColorScheme(
			styles.infoIcon,
			styles.infoIconDark
		);

		return (
			<TouchableWithoutFeedback
				accessibilityLabel={ __( 'Help icon' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
				onPress={ this.toggleSheet }
			>
				<View style={ styles.helpIconContainer }>
					<Icon
						className="unsupported-icon-help"
						label={ __( 'Help icon' ) }
						icon={ help }
						color={ infoIconStyle.color }
					/>
				</View>
			</TouchableWithoutFeedback>
		);
	}

	requestFallback() {
		this.toggleSheet();
		this.setState( { sendFallbackMessage: true } );
	}

	renderSheet( title ) {
		const { getStylesFromColorScheme, attributes, clientId } = this.props;
		const infoTextStyle = getStylesFromColorScheme(
			styles.infoText,
			styles.infoTextDark
		);
		const infoTitleStyle = getStylesFromColorScheme(
			styles.infoTitle,
			styles.infoTitleDark
		);
		const infoDescriptionStyle = getStylesFromColorScheme(
			styles.infoDescription,
			styles.infoDescriptionDark
		);
		const infoSheetIconStyle = getStylesFromColorScheme(
			styles.infoSheetIcon,
			styles.infoSheetIconDark
		);

		const titleFormat =
			Platform.OS === 'android'
				? // translators: %s: Name of the block
				  __( "'%s' isn't yet supported on WordPress for Android" )
				: // translators: %s: Name of the block
				  __( "'%s' isn't yet supported on WordPress for iOS" );
		const infoTitle = sprintf( titleFormat, title );

		const actionButtonStyle = getStylesFromColorScheme(
			styles.actionButton,
			styles.actionButtonDark
		);

		return (
			<BottomSheet
				isVisible={ this.state.showHelp }
				hideHeader
				onClose={ this.toggleSheet }
				onModalHide={ () => {
					if ( this.state.sendFallbackMessage ) {
						// On iOS, onModalHide is called when the controller is still part of the hierarchy.
						// A small delay will ensure that the controller has already been removed.
						this.timeout = setTimeout( () => {
							requestUnsupportedBlockFallback(
								attributes.originalContent,
								clientId,
								title
							);
						}, 100 );
						this.setState( { sendFallbackMessage: false } );
					}
				} }
			>
				<View style={ styles.infoContainer }>
					<Icon
						icon={ help }
						color={ infoSheetIconStyle.color }
						size={ styles.infoSheetIcon.size }
					/>
					<Text style={ [ infoTextStyle, infoTitleStyle ] }>
						{ infoTitle }
					</Text>
					<Text style={ [ infoTextStyle, infoDescriptionStyle ] }>
						{
							// eslint-disable-next-line no-undef
							__DEV__
								? __(
										"We are working hard to add more blocks with each release. In the meantime, you can also edit this block using your device's web browser."
								  )
								: __(
										'We are working hard to add more blocks with each release. In the meantime, you can also edit this post on the web.'
								  )
						}
					</Text>
				</View>
				{
					// eslint-disable-next-line no-undef
					__DEV__ && (
						<>
							<BottomSheet.Cell
								label={ __( 'Edit block in web browser' ) }
								separatorType="topFullWidth"
								onPress={ this.requestFallback }
								labelStyle={ actionButtonStyle }
							/>
							<BottomSheet.Cell
								label={ __( 'Dismiss' ) }
								separatorType="topFullWidth"
								onPress={ this.toggleSheet }
								labelStyle={ actionButtonStyle }
							/>
						</>
					)
				}
			</BottomSheet>
		);
	}

	render() {
		const { originalName } = this.props.attributes;
		const { getStylesFromColorScheme, preferredColorScheme } = this.props;
		const blockType = coreBlocks[ originalName ];

		const title = blockType ? blockType.settings.title : originalName;
		const titleStyle = getStylesFromColorScheme(
			styles.unsupportedBlockMessage,
			styles.unsupportedBlockMessageDark
		);

		const subTitleStyle = getStylesFromColorScheme(
			styles.unsupportedBlockSubtitle,
			styles.unsupportedBlockSubtitleDark
		);
		const subtitle = (
			<Text style={ subTitleStyle }>{ __( 'Unsupported' ) }</Text>
		);

		const icon = blockType
			? normalizeIconObject( blockType.settings.icon )
			: plugins;
		const iconStyle = getStylesFromColorScheme(
			styles.unsupportedBlockIcon,
			styles.unsupportedBlockIconDark
		);
		const iconClassName = 'unsupported-icon' + '-' + preferredColorScheme;
		return (
			<View
				style={ getStylesFromColorScheme(
					styles.unsupportedBlock,
					styles.unsupportedBlockDark
				) }
			>
				{ this.renderHelpIcon() }
				<Icon
					className={ iconClassName }
					icon={ icon && icon.src ? icon.src : icon }
					color={ iconStyle.color }
				/>
				<Text style={ titleStyle }>{ title }</Text>
				{ subtitle }
				{ this.renderSheet( title ) }
			</View>
		);
	}
}

export default withPreferredColorScheme( UnsupportedBlockEdit );
