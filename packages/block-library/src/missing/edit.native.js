/**
 * External dependencies
 */
import {
	View,
	Text,
	TouchableWithoutFeedback,
	TouchableHighlight,
} from 'react-native';

/**
 * WordPress dependencies
 */
import {
	requestUnsupportedBlockFallback,
	sendActionButtonPressedAction,
	actionButtons,
} from '@wordpress/react-native-bridge';
import { BottomSheet, Icon, TextControl } from '@wordpress/components';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { normalizeIconObject } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { help, plugins } from '@wordpress/icons';
import { withSelect, withDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';

// Blocks that can't be edited through the Unsupported block editor identified by their name.
const UBE_INCOMPATIBLE_BLOCKS = [ 'core/block' ];
const I18N_BLOCK_SCHEMA_TITLE = 'block title';

export class UnsupportedBlockEdit extends Component {
	constructor( props ) {
		super( props );
		this.state = { showHelp: false };
		this.toggleSheet = this.toggleSheet.bind( this );
		this.closeSheet = this.closeSheet.bind( this );
		this.requestFallback = this.requestFallback.bind( this );
		this.onHelpButtonPressed = this.onHelpButtonPressed.bind( this );
	}

	toggleSheet() {
		this.setState( {
			showHelp: ! this.state.showHelp,
		} );
	}

	closeSheet() {
		this.setState( {
			showHelp: false,
		} );
	}

	componentWillUnmount() {
		if ( this.timeout ) {
			clearTimeout( this.timeout );
		}
	}

	getTitle() {
		const { originalName } = this.props.attributes;
		const blockType = coreBlocks[ originalName ];
		const title = blockType?.metadata.title;
		const textdomain = blockType?.metadata.textdomain;

		return title && textdomain
			? // eslint-disable-next-line @wordpress/i18n-no-variables, @wordpress/i18n-text-domain
			  _x( title, I18N_BLOCK_SCHEMA_TITLE, textdomain )
			: originalName;
	}

	renderHelpIcon() {
		const infoIconStyle = this.props.getStylesFromColorScheme(
			styles.infoIcon,
			styles.infoIconDark
		);

		return (
			<TouchableHighlight
				onPress={ this.onHelpButtonPressed }
				style={ styles.helpIconContainer }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
			>
				<Icon
					className="unsupported-icon-help"
					label={ __( 'Help icon' ) }
					icon={ help }
					color={ infoIconStyle.color }
				/>
			</TouchableHighlight>
		);
	}

	onHelpButtonPressed() {
		if ( ! this.props.isSelected ) {
			this.props.selectBlock();
		}
		this.toggleSheet();
	}

	requestFallback() {
		if (
			this.props.canEnableUnsupportedBlockEditor &&
			this.props.isUnsupportedBlockEditorSupported === false
		) {
			this.toggleSheet();
			this.setState( { sendButtonPressMessage: true } );
		} else {
			this.toggleSheet();
			this.setState( { sendFallbackMessage: true } );
		}
	}

	renderSheet( blockTitle, blockName ) {
		const {
			getStylesFromColorScheme,
			attributes,
			clientId,
			isUnsupportedBlockEditorSupported,
			canEnableUnsupportedBlockEditor,
			isEditableInUnsupportedBlockEditor,
		} = this.props;
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

		/* translators: Missing block alert title. %s: The localized block name */
		const titleFormat = __( "'%s' is not fully-supported" );
		const infoTitle = sprintf( titleFormat, blockTitle );
		const missingBlockDetail = applyFilters(
			'native.missing_block_detail',
			__( 'We are working hard to add more blocks with each release.' )
		);
		const missingBlockActionButton = applyFilters(
			'native.missing_block_action_button',
			__( 'Edit using web editor' )
		);

		const actionButtonStyle = getStylesFromColorScheme(
			styles.actionButton,
			styles.actionButtonDark
		);

		return (
			<BottomSheet
				isVisible={ this.state.showHelp }
				hideHeader
				onClose={ this.closeSheet }
				onModalHide={ () => {
					if ( this.state.sendFallbackMessage ) {
						// On iOS, onModalHide is called when the controller is still part of the hierarchy.
						// A small delay will ensure that the controller has already been removed.
						this.timeout = setTimeout( () => {
							// For the Classic block, the content is kept in the `content` attribute.
							const content =
								blockName === 'core/freeform'
									? attributes.content
									: attributes.originalContent;
							requestUnsupportedBlockFallback(
								content,
								clientId,
								blockName,
								blockTitle
							);
						}, 100 );
						this.setState( { sendFallbackMessage: false } );
					} else if ( this.state.sendButtonPressMessage ) {
						this.timeout = setTimeout( () => {
							sendActionButtonPressedAction(
								actionButtons.missingBlockAlertActionButton
							);
						}, 100 );
						this.setState( { sendButtonPressMessage: false } );
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
					{ isEditableInUnsupportedBlockEditor && (
						<Text style={ [ infoTextStyle, infoDescriptionStyle ] }>
							{ missingBlockDetail }
						</Text>
					) }
				</View>
				{ ( isUnsupportedBlockEditorSupported ||
					canEnableUnsupportedBlockEditor ) &&
					isEditableInUnsupportedBlockEditor && (
						<>
							<TextControl
								label={ missingBlockActionButton }
								separatorType="topFullWidth"
								onPress={ this.requestFallback }
								labelStyle={ actionButtonStyle }
							/>
							<TextControl
								label={ __( 'Dismiss' ) }
								separatorType="topFullWidth"
								onPress={ this.toggleSheet }
								labelStyle={ actionButtonStyle }
							/>
						</>
					) }
			</BottomSheet>
		);
	}

	render() {
		const { originalName } = this.props.attributes;
		const { getStylesFromColorScheme, preferredColorScheme } = this.props;
		const blockType = coreBlocks[ originalName ];

		const title = this.getTitle();
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
			<TouchableWithoutFeedback
				disabled={ ! this.props.isSelected }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
				onPress={ this.toggleSheet }
			>
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
					{ this.renderSheet( title, originalName ) }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default compose( [
	withSelect( ( select, { attributes } ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			isUnsupportedBlockEditorSupported:
				getSettings( 'capabilities' ).unsupportedBlockEditor === true,
			canEnableUnsupportedBlockEditor:
				getSettings( 'capabilities' )
					.canEnableUnsupportedBlockEditor === true,
			isEditableInUnsupportedBlockEditor: ! UBE_INCOMPATIBLE_BLOCKS.includes(
				attributes.originalName
			),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { selectBlock } = dispatch( blockEditorStore );
		return {
			selectBlock() {
				selectBlock( ownProps.clientId );
			},
		};
	} ),
	withPreferredColorScheme,
] )( UnsupportedBlockEdit );
