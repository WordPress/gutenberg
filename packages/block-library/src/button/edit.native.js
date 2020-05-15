/**
 * External dependencies
 */
import {
	View,
	AccessibilityInfo,
	Platform,
	Clipboard,
	Text,
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
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	PanelBody,
	PanelActions,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
	BottomSheet,
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
import ColorEdit from './color-edit';
import getColorAndStyleProps from './color-props';

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_MAX_WIDTH = 108;
const PREPEND_HTTP = 'http://';

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
		this.onSetMaxWidth = this.onSetMaxWidth.bind( this );
		this.dismissSheet = this.dismissSheet.bind( this );
		this.getURLFromClipboard = this.getURLFromClipboard.bind( this );
		this.onShowLinkSettings = this.onShowLinkSettings.bind( this );
		this.onHideLinkSettings = this.onHideLinkSettings.bind( this );
		this.onToggleButtonFocus = this.onToggleButtonFocus.bind( this );
		this.setRef = this.setRef.bind( this );
		this.onRemove = this.onRemove.bind( this );
		this.getPlaceholderWidth = this.getPlaceholderWidth.bind( this );

		// `isEditingURL` property is used to prevent from automatically pasting
		// URL from clipboard while trying to clear `Button URL` field and then
		// manually adding specific link
		this.isEditingURL = false;

		this.state = {
			maxWidth: INITIAL_MAX_WIDTH,
			isLinkSheetVisible: false,
			isButtonFocused: true,
			placeholderTextWidth: 0,
		};
	}

	componentDidMount() {
		this.onSetMaxWidth();
	}

	componentDidUpdate( prevProps, prevState ) {
		const {
			selectedId,
			setAttributes,
			editorSidebarOpened,
			attributes: { url },
			parentWidth,
		} = this.props;
		const { isLinkSheetVisible, isButtonFocused } = this.state;

		if ( prevProps.selectedId !== selectedId ) {
			this.onToggleButtonFocus( true );
		}

		if ( prevProps.parentWidth !== parentWidth ) {
			this.onSetMaxWidth();
		}

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
		const { backgroundColor, attributes } = this.props;
		const { gradient, customGradient } = attributes;
		const defaultGradients = SETTINGS_DEFAULTS.gradients;

		if ( customGradient || gradient ) {
			return (
				customGradient ||
				defaultGradients.find(
					( defaultGradient ) => defaultGradient.slug === gradient
				).gradient
			);
		}
		return (
			getColorAndStyleProps( attributes ).style?.backgroundColor ||
			// We still need the `backgroundColor.color` to support colors from the color pallete (not custom ones)
			backgroundColor.color ||
			styles.defaultButton.backgroundColor
		);
	}

	getTextColor() {
		const { textColor, attributes } = this.props;
		return (
			getColorAndStyleProps( attributes ).style?.color ||
			// We still need the `textColor.color` to support colors from the color pallete (not custom ones)
			textColor.color ||
			styles.defaultButton.color
		);
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

	onShowLinkSettings() {
		this.setState( { isLinkSheetVisible: true } );
	}

	onHideLinkSettings() {
		this.setState( { isLinkSheetVisible: false } );
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
		this.onSetMaxWidth( width );
	}

	onSetMaxWidth( width ) {
		const { maxWidth } = this.state;
		const { parentWidth } = this.props;
		const { marginRight: spacing } = styles.defaultButton;

		const isParentWidthChanged = maxWidth !== parentWidth;
		const isWidthChanged = maxWidth !== width;

		if ( parentWidth && ! width && isParentWidthChanged ) {
			this.setState( {
				maxWidth: parentWidth,
			} );
		} else if ( ! parentWidth && width && isWidthChanged ) {
			this.setState( { maxWidth: width - spacing } );
		}
	}

	onRemove() {
		const { numOfButtons, onDeleteBlock, onReplace } = this.props;

		if ( numOfButtons === 1 ) {
			onDeleteBlock();
		} else {
			onReplace( [] );
		}
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
					keyboardType="url"
				/>
				<ToggleControl
					icon={ ! isCompatibleWithSettings && external }
					label={ __( 'Open in new tab' ) }
					checked={ linkTarget === '_blank' }
					onChange={ this.onChangeOpenInNewTab }
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
					keyboardType="url"
				/>
			</>
		);
	}

	setRef( richText ) {
		this.richTextRef = richText;
	}

	// Render `Text` with `placeholderText` styled as a placeholder
	// to calculate its width which then is set as a `minWidth`
	getPlaceholderWidth( placeholderText ) {
		const { maxWidth, placeholderTextWidth } = this.state;
		return (
			<Text
				style={ styles.placeholder }
				onTextLayout={ ( { nativeEvent } ) => {
					const textWidth =
						nativeEvent.lines[ 0 ] && nativeEvent.lines[ 0 ].width;
					if ( textWidth && textWidth !== placeholderTextWidth ) {
						this.setState( {
							placeholderTextWidth: Math.min(
								textWidth,
								maxWidth
							),
						} );
					}
				} }
			>
				{ placeholderText }
			</Text>
		);
	}

	render() {
		const {
			attributes,
			isSelected,
			clientId,
			onReplace,
			mergeBlocks,
			parentWidth,
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
			placeholderTextWidth,
		} = this.state;
		const { paddingTop: spacing, borderWidth } = styles.defaultButton;

		if ( parentWidth === 0 ) {
			return null;
		}

		const borderRadiusValue = Number.isInteger( borderRadius )
			? borderRadius
			: styles.defaultButton.borderRadius;
		const outlineBorderRadius =
			borderRadiusValue > 0
				? borderRadiusValue + spacing + borderWidth
				: 0;

		// To achieve proper expanding and shrinking `RichText` on iOS, there is a need to set a `minWidth`
		// value at least on 1 when `RichText` is focused or when is not focused, but `RichText` value is
		// different than empty string.
		const minWidth =
			isButtonFocused || ( ! isButtonFocused && text && text !== '' )
				? 1
				: placeholderTextWidth;
		// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
		// a `placeholder` as an empty string when `RichText` is focused,
		// because `AztecView` is calculating a `minWidth` based on placeholder text.
		const placeholderText =
			isButtonFocused || ( ! isButtonFocused && text && text !== '' )
				? ''
				: placeholder || __( 'Add text…' );

		const backgroundColor = this.getBackgroundColor();
		const textColor = this.getTextColor();

		const actions = [
			{
				label: __( 'Remove link' ),
				onPress: this.onClearSettings,
			},
		];

		return (
			<View onLayout={ this.onLayout }>
				{ this.getPlaceholderWidth( placeholderText ) }
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
							color: textColor,
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
						selectionColor={ textColor }
						onBlur={ () => {
							this.onToggleButtonFocus( false );
							this.onSetMaxWidth();
						} }
						onReplace={ onReplace }
						onRemove={ this.onRemove }
						onMerge={ mergeBlocks }
					/>
				</ColorBackground>

				{ isSelected && (
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								title={ __( 'Edit link' ) }
								icon={ link }
								onClick={ this.onShowLinkSettings }
								isActive={ url && url !== PREPEND_HTTP }
							/>
						</ToolbarGroup>
					</BlockControls>
				) }

				<BottomSheet
					isVisible={ isLinkSheetVisible }
					onClose={ this.onHideLinkSettings }
					hideHeader
				>
					<PanelBody style={ styles.linkSettingsPanel }>
						{ this.getLinkSettings( url, rel, linkTarget ) }
					</PanelBody>
					<PanelActions actions={ actions } />
				</BottomSheet>

				<ColorEdit { ...this.props } />
				<InspectorControls>
					<PanelBody title={ __( 'Border Settings' ) }>
						<RangeControl
							label={ __( 'Border Radius' ) }
							minimumValue={ MIN_BORDER_RADIUS_VALUE }
							maximumValue={ MAX_BORDER_RADIUS_VALUE }
							value={ borderRadiusValue }
							onChange={ this.onChangeBorderRadius }
						/>
					</PanelBody>
					<PanelBody title={ __( 'Link Settings' ) }>
						{ this.getLinkSettings( url, rel, linkTarget, true ) }
					</PanelBody>
				</InspectorControls>
			</View>
		);
	}
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withSelect( ( select, { clientId } ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		const {
			getSelectedBlockClientId,
			getBlockCount,
			getBlockRootClientId,
		} = select( 'core/block-editor' );

		const parentId = getBlockRootClientId( clientId );
		const selectedId = getSelectedBlockClientId();
		const numOfButtons = getBlockCount( parentId );

		return {
			selectedId,
			editorSidebarOpened: isEditorSidebarOpened(),
			numOfButtons,
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
