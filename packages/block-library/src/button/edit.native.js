/**
 * External dependencies
 */
import {
	View,
	AccessibilityInfo,
	Platform,
	Clipboard,
	LayoutAnimation,
	UIManager,
} from 'react-native';
/**
 * WordPress dependencies
 */
import { withInstanceId, compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	withColors,
	InspectorControls,
	BlockControls,
	SETTINGS_DEFAULTS,
	__experimentalWithSetGradient,
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	PanelBody,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
	BottomSheet,
	BottomSheetConsumer,
	ColorControl,
	ColorSettings,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { isURL, prependHTTP } from '@wordpress/url';
import { link, external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import richTextStyle from './rich-text.scss';
import styles from './editor.scss';
import ColorBackground from './color-background';
import LinkRelIcon from './link-rel';

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_MAX_WIDTH = 108;
const PREPEND_HTTP = 'http://';
const ANIMATION_DURATION = 300;
// It's needed to set the following flags via UIManager
// to have `LayoutAnimation` working on Android
if (
	Platform.OS === 'android' &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental( true );
}

class ButtonEdit extends Component {
	constructor( props ) {
		super( props );
		this.onChangeText = this.onChangeText.bind( this );
		this.onChangeBorderRadius = this.onChangeBorderRadius.bind( this );
		this.onChangeLinkRel = this.onChangeLinkRel.bind( this );
		this.onChangeOpenInNewTab = this.onChangeOpenInNewTab.bind( this );
		this.onChangeURL = this.onChangeURL.bind( this );
		this.onClearSettings = this.onClearSettings.bind( this );
		this.onLayout = this.onLayout.bind( this );
		this.dismissSheet = this.dismissSheet.bind( this );
		this.getURLFromClipboard = this.getURLFromClipboard.bind( this );
		this.onToggleLinkSettings = this.onToggleLinkSettings.bind( this );
		this.onToggleButtonFocus = this.onToggleButtonFocus.bind( this );
		this.setRef = this.setRef.bind( this );
		this.changeBottomSheetContent = this.changeBottomSheetContent.bind(
			this
		);

		// `isEditingURL` property is used to prevent from automatically pasting
		// URL from clipboard while trying to clear `Button URL` field and then
		// manually adding specific link
		this.isEditingURL = false;

		const isButtonFocused =
			Platform.OS === 'ios' ? ! props.hasParents : true;

		this.state = {
			maxWidth: INITIAL_MAX_WIDTH,
			isLinkSheetVisible: false,
			isButtonFocused,
			previousScreen: '',
			screen: 'Settings',
		};
	}

	componentDidUpdate( prevProps, prevState ) {
		const {
			selectedId,
			setAttributes,
			editorSidebarOpened,
			attributes: { url },
		} = this.props;
		const { isLinkSheetVisible, isButtonFocused } = this.state;

		if (
			( prevProps.editorSidebarOpened && ! editorSidebarOpened ) ||
			( prevState.isLinkSheetVisible && ! isLinkSheetVisible )
		) {
			// Prepends "http://" to an url when closing link settings sheet and button settings sheet
			setAttributes( { url: prependHTTP( url ) } );
			// Get initial value for `isEditingURL` when closing link settings sheet or button settings sheet
			this.isEditingURL = false;
		}

		// Blur `RichText` on Android when link settings sheet or button settings sheet is opened,
		// to avoid flashing caret after closing one of them
		if (
			( ! prevProps.editorSidebarOpened && editorSidebarOpened ) ||
			( ! prevState.isLinkSheetVisible && isLinkSheetVisible )
		) {
			this.setState( { screen: 'Settings' } );
			if ( Platform.OS === 'android' && this.richTextRef ) {
				this.richTextRef.blur();
				this.onToggleButtonFocus( false );
			}
		}

		// Paste a URL from clipboard
		if (
			( isLinkSheetVisible || editorSidebarOpened ) &&
			! url &&
			! this.isEditingURL
		) {
			this.getURLFromClipboard();
		}

		if ( this.richTextRef ) {
			const selectedRichText = this.richTextRef.props.id === selectedId;

			if ( ! selectedRichText && isButtonFocused ) {
				this.onToggleButtonFocus( false );
			}

			if (
				selectedRichText &&
				selectedId !== prevProps.selectedId &&
				! isButtonFocused
			) {
				AccessibilityInfo.isScreenReaderEnabled().then( ( enabled ) => {
					if ( enabled ) {
						this.onToggleButtonFocus( true );
						this.richTextRef.focus();
					}
				} );
			}
		}
	}

	async getURLFromClipboard() {
		const { setAttributes } = this.props;
		const clipboardText = await Clipboard.getString();

		if ( ! clipboardText ) {
			return;
		}
		// Check if pasted text is URL
		if ( ! isURL( clipboardText ) ) {
			return;
		}

		setAttributes( { url: clipboardText } );
	}

	getBackgroundColor() {
		const { attributes, backgroundColor } = this.props;
		const { gradient, customGradient } = attributes;
		const fallbackBackgroundColor = styles.fallbackButton.backgroundColor;
		const defaultGradients = SETTINGS_DEFAULTS.gradients;

		if ( gradient ) {
			const gradientColor = defaultGradients.find(
				( defaultGradient ) => defaultGradient.slug === gradient
			).gradient;
			return gradientColor;
		} else if ( customGradient ) {
			return customGradient;
		}
		return backgroundColor.color || fallbackBackgroundColor;
	}

	onChangeText( value ) {
		const { setAttributes } = this.props;
		setAttributes( { text: value } );
	}

	onChangeBorderRadius( value ) {
		const { setAttributes } = this.props;
		setAttributes( {
			borderRadius: value,
		} );
	}

	onChangeLinkRel( value ) {
		const { setAttributes } = this.props;
		setAttributes( { rel: value } );
	}

	onChangeURL( value ) {
		this.isEditingURL = true;
		const { setAttributes } = this.props;
		setAttributes( { url: value } );
	}

	onChangeOpenInNewTab( value ) {
		const { setAttributes, attributes } = this.props;
		const { rel } = attributes;

		const newLinkTarget = value ? '_blank' : undefined;

		let updatedRel = rel;
		if ( newLinkTarget && ! rel ) {
			updatedRel = NEW_TAB_REL;
		} else if ( ! newLinkTarget && rel === NEW_TAB_REL ) {
			updatedRel = undefined;
		}

		setAttributes( {
			linkTarget: newLinkTarget,
			rel: updatedRel,
		} );
	}

	onToggleLinkSettings() {
		const { isLinkSheetVisible } = this.state;
		this.setState( { isLinkSheetVisible: ! isLinkSheetVisible } );
	}

	onToggleButtonFocus( value ) {
		this.setState( { isButtonFocused: value } );
	}

	onClearSettings() {
		const { setAttributes } = this.props;

		setAttributes( {
			url: '',
			rel: '',
			linkTarget: '',
		} );

		this.setState( { isLinkSheetVisible: false } );
	}

	onLayout( { nativeEvent } ) {
		const { width } = nativeEvent.layout;
		const { marginRight } = styles.button;
		const buttonSpacing = 2 * marginRight;
		this.setState( { maxWidth: width - buttonSpacing } );
	}

	dismissSheet() {
		this.setState( {
			isLinkSheetVisible: false,
		} );
		this.props.closeSettingsBottomSheet();
	}

	getLinkSettings( url, rel, linkTarget, isCompatibleWithSettings ) {
		return (
			<>
				<TextControl
					icon={ ! isCompatibleWithSettings && link }
					label={ __( 'Button Link URL' ) }
					value={ url || '' }
					valuePlaceholder={ __( 'Add URL' ) }
					onChange={ this.onChangeURL }
					onSubmit={ this.dismissSheet }
					autoCapitalize="none"
					autoCorrect={ false }
					// eslint-disable-next-line jsx-a11y/no-autofocus
					autoFocus={
						! isCompatibleWithSettings && Platform.OS === 'ios'
					}
					separatorType={
						isCompatibleWithSettings ? 'fullWidth' : 'leftMargin'
					}
					keyboardType="url"
				/>
				<ToggleControl
					icon={ ! isCompatibleWithSettings && external }
					label={ __( 'Open in new tab' ) }
					checked={ linkTarget === '_blank' }
					onChange={ this.onChangeOpenInNewTab }
					separatorType={
						isCompatibleWithSettings ? 'fullWidth' : 'leftMargin'
					}
				/>
				<TextControl
					icon={ ! isCompatibleWithSettings && LinkRelIcon }
					label={ __( 'Link Rel' ) }
					value={ rel || '' }
					valuePlaceholder={ __( 'None' ) }
					onChange={ this.onChangeLinkRel }
					onSubmit={ this.dismissSheet }
					autoCapitalize="none"
					autoCorrect={ false }
					separatorType={
						isCompatibleWithSettings ? 'none' : 'fullWidth'
					}
					keyboardType="url"
				/>
			</>
		);
	}

	setRef( richText ) {
		this.richTextRef = richText;
	}

	changeBottomSheetContent( destination, callback ) {
		const { screen } = this.state;
		LayoutAnimation.configureNext(
			LayoutAnimation.create(
				ANIMATION_DURATION,
				LayoutAnimation.Types.easeInEaseOut,
				LayoutAnimation.Properties.opacity
			)
		);
		this.setState(
			{
				screen: destination,
				previousScreen: screen,
			},
			() => {
				if ( callback ) {
					callback();
				}
			}
		);
	}

	render() {
		const {
			attributes,
			textColor,
			isSelected,
			clientId,
			onReplace,
			setBackgroundColor,
			setTextColor,
			setGradient,
		} = this.props;
		const {
			placeholder,
			text,
			borderRadius,
			url,
			linkTarget,
			rel,
		} = attributes;
		const {
			maxWidth,
			isLinkSheetVisible,
			isButtonFocused,
			screen,
			previousScreen,
		} = this.state;

		const borderRadiusValue =
			borderRadius !== undefined
				? borderRadius
				: styles.button.borderRadius;
		const outlineBorderRadius =
			borderRadiusValue > 0
				? borderRadiusValue +
				  styles.button.paddingTop +
				  styles.button.borderWidth
				: 0;

		// To achieve proper expanding and shrinking `RichText` on iOS, there is a need to set a `minWidth`
		// value at least on 1 when `RichText` is focused or when is not focused, but `RichText` value is
		// different than empty string.
		const minWidth =
			isButtonFocused || ( ! isButtonFocused && text && text !== '' )
				? 1
				: styles.button.minWidth;
		// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
		// a `placeholder` as an empty string when `RichText` is focused,
		// because `AztecView` is calculating a `minWidth` based on placeholder text.
		const placeholderText =
			isButtonFocused || ( ! isButtonFocused && text && text !== '' )
				? ''
				: placeholder || __( 'Add text…' );

		const backgroundColor = this.getBackgroundColor();

		return (
			<View style={ { flex: 1 } } onLayout={ this.onLayout }>
				<ColorBackground
					borderRadiusValue={ borderRadiusValue }
					backgroundColor={ backgroundColor }
					isSelected={ isSelected }
				>
					{ isSelected && (
						<View
							pointerEvents="none"
							style={ [
								styles.outline,
								{
									borderRadius: outlineBorderRadius,
									// Border Width has to be spread since width is thicker
									// on Android when border radius is decreased to 0
									borderLeftWidth: styles.button.borderWidth,
									borderTopWidth: styles.button.borderWidth,
									borderBottomWidth:
										styles.button.borderWidth,
									borderRightWidth: styles.button.borderWidth,
									borderColor: backgroundColor,
								},
							] }
						/>
					) }
					<RichText
						setRef={ this.setRef }
						placeholder={ placeholderText }
						value={ text }
						onChange={ this.onChangeText }
						style={ {
							...richTextStyle.richText,
							color: textColor.color || '#ffffff',
						} }
						textAlign="center"
						placeholderTextColor={
							styles.placeholderTextColor.color
						}
						identifier="content"
						tagName="p"
						minWidth={ minWidth }
						maxWidth={ maxWidth }
						id={ clientId }
						isSelected={ isButtonFocused }
						withoutInteractiveFormatting
						unstableOnFocus={ () =>
							this.onToggleButtonFocus( true )
						}
						__unstableMobileNoFocusOnMount={ ! isSelected }
						selectionColor={ textColor.color || '#ffffff' }
						onReplace={ onReplace }
						onRemove={ () => onReplace( [] ) }
					/>
				</ColorBackground>

				{ isSelected && (
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								title={ __( 'Edit image' ) }
								icon={ link }
								onClick={ this.onToggleLinkSettings }
								isActive={ url && url !== PREPEND_HTTP }
							/>
						</ToolbarGroup>
					</BlockControls>
				) }

				<BottomSheet
					isVisible={ isLinkSheetVisible }
					onClose={ this.onToggleLinkSettings }
					hideHeader
				>
					{ this.getLinkSettings( url, rel, linkTarget ) }
					<BottomSheet.Cell
						label={ __( 'Remove link' ) }
						labelStyle={ styles.clearLinkButton }
						separatorType={ 'none' }
						onPress={ this.onClearSettings }
					/>
				</BottomSheet>

				<InspectorControls>
					<BottomSheetConsumer>
						{ ( {
							isBottomSheetScrolling,
							shouldEnableBottomSheetScroll,
							shouldSetBottomSheetMaxHeight,
							onCloseBottomSheet,
							onBackButtonPress,
						} ) => {
							return (
								<>
									{ screen === 'Settings' && (
										<View>
											<PanelBody
												title={ __(
													'Border Settings'
												) }
											>
												<RangeControl
													label={ __(
														'Border Radius'
													) }
													minimumValue={
														MIN_BORDER_RADIUS_VALUE
													}
													maximumValue={
														MAX_BORDER_RADIUS_VALUE
													}
													value={ borderRadiusValue }
													onChange={
														this
															.onChangeBorderRadius
													}
													separatorType="none"
												/>
											</PanelBody>
											<PanelBody
												title={ __( 'Color Settings' ) }
											>
												<ColorControl
													onPress={ () => {
														this.changeBottomSheetContent(
															'Background'
														);
													} }
													label={ __( 'Background' ) }
													color={ backgroundColor }
													separatorType="fullWidth"
												/>
												<ColorControl
													onPress={ () => {
														this.changeBottomSheetContent(
															'Text'
														);
													} }
													label={ __( 'Text' ) }
													color={
														textColor.color ||
														'#ffffff'
													}
													separatorType="none"
												/>
											</PanelBody>
											<PanelBody
												title={ __( 'Link Settings' ) }
											>
												{ this.getLinkSettings(
													url,
													rel,
													linkTarget,
													true
												) }
											</PanelBody>
										</View>
									) }
									{ screen !== 'Settings' && (
										<ColorSettings
											screen={ screen }
											changeBottomSheetContent={ (
												destination
											) =>
												this.changeBottomSheetContent(
													destination
												)
											}
											backgroundColor={ backgroundColor }
											textColor={
												textColor.color || '#ffffff'
											}
											setTextColor={ setTextColor }
											setBackgroundColor={
												setBackgroundColor
											}
											setGradient={ setGradient }
											clientId={ clientId }
											previousScreen={ previousScreen }
											shouldEnableBottomSheetScroll={
												shouldEnableBottomSheetScroll
											}
											isBottomSheetScrolling={
												isBottomSheetScrolling
											}
											shouldSetBottomSheetMaxHeight={
												shouldSetBottomSheetMaxHeight
											}
											onCloseBottomSheet={
												onCloseBottomSheet
											}
											onBackButtonPress={
												onBackButtonPress
											}
											defaultSettings={
												SETTINGS_DEFAULTS
											}
										/>
									) }
								</>
							);
						} }
					</BottomSheetConsumer>
				</InspectorControls>
			</View>
		);
	}
}

export default compose( [
	withInstanceId,
	__experimentalWithSetGradient,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withSelect( ( select ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		const { getSelectedBlockClientId, getBlockParents } = select(
			'core/block-editor'
		);

		const selectedId = getSelectedBlockClientId();
		const hasParents = getBlockParents( selectedId ).length > 0;

		return {
			selectedId,
			editorSidebarOpened: isEditorSidebarOpened(),
			hasParents,
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			closeSettingsBottomSheet() {
				dispatch( 'core/edit-post' ).closeGeneralSidebar();
			},
		};
	} ),
] )( ButtonEdit );
