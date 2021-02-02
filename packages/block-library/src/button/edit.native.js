/**
 * External dependencies
 */
import { View, AccessibilityInfo, Platform, Text } from 'react-native';
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
	withGradient,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
	LinkSettingsNavigation,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import richTextStyle from './rich-text.scss';
import styles from './editor.scss';
import ColorBackground from './color-background';
import ColorEdit from './color-edit';
import getColorAndStyleProps from './color-props';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_MAX_WIDTH = 108;
const MIN_WIDTH = 40;

class ButtonEdit extends Component {
	constructor( props ) {
		super( props );
		this.onChangeText = this.onChangeText.bind( this );
		this.onChangeBorderRadius = this.onChangeBorderRadius.bind( this );
		this.onClearSettings = this.onClearSettings.bind( this );
		this.onLayout = this.onLayout.bind( this );
		this.onSetMaxWidth = this.onSetMaxWidth.bind( this );
		this.dismissSheet = this.dismissSheet.bind( this );
		this.onShowLinkSettings = this.onShowLinkSettings.bind( this );
		this.onHideLinkSettings = this.onHideLinkSettings.bind( this );
		this.onToggleButtonFocus = this.onToggleButtonFocus.bind( this );
		this.setRef = this.setRef.bind( this );
		this.onRemove = this.onRemove.bind( this );
		this.getPlaceholderWidth = this.getPlaceholderWidth.bind( this );

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
		const { selectedId, editorSidebarOpened, parentWidth } = this.props;
		const { isLinkSheetVisible, isButtonFocused } = this.state;

		if ( prevProps.selectedId !== selectedId ) {
			this.onToggleButtonFocus( true );
		}

		if ( prevProps.parentWidth !== parentWidth ) {
			this.onSetMaxWidth();
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

	getBackgroundColor() {
		const { backgroundColor, attributes, gradientValue } = this.props;
		const { customGradient } = attributes;

		if ( customGradient || gradientValue ) {
			return customGradient || gradientValue;
		}
		const colorAndStyleProps = getColorAndStyleProps( attributes );
		return (
			colorAndStyleProps.style?.backgroundColor ||
			colorAndStyleProps.style?.background ||
			// We still need the `backgroundColor.color` to support colors from the color pallete (not custom ones)
			backgroundColor.color ||
			styles.defaultButton.backgroundColor
		);
	}

	getTextColor() {
		const { textColor, attributes } = this.props;
		const colorAndStyleProps = getColorAndStyleProps( attributes );

		return (
			colorAndStyleProps.style?.color ||
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

		this.onHideLinkSettings();
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
				maxWidth: Math.min(
					parentWidth,
					this.props.maxWidth - 2 * spacing
				),
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
		this.onHideLinkSettings();
		this.props.closeSettingsBottomSheet();
	}

	getLinkSettings( isCompatibleWithSettings ) {
		const { isLinkSheetVisible } = this.state;
		const { attributes, setAttributes } = this.props;
		const actions = [
			{
				label: __( 'Remove link' ),
				onPress: this.onClearSettings,
			},
		];

		const options = {
			url: {
				label: __( 'Button Link URL' ),
				placeholder: __( 'Add URL' ),
				autoFocus: ! isCompatibleWithSettings,
				autoFill: true,
			},
			openInNewTab: {
				label: __( 'Open in new tab' ),
			},
			linkRel: {
				label: __( 'Link Rel' ),
				placeholder: __( 'None' ),
			},
		};

		return (
			<LinkSettingsNavigation
				isVisible={ isLinkSheetVisible }
				attributes={ attributes }
				onClose={ this.dismissSheet }
				setAttributes={ setAttributes }
				withBottomSheet={ ! isCompatibleWithSettings }
				hasPicker
				actions={ actions }
				options={ options }
				showIcon={ ! isCompatibleWithSettings }
			/>
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
			align = 'center',
		} = attributes;
		const { maxWidth, isButtonFocused, placeholderTextWidth } = this.state;
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
				? MIN_WIDTH
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
						textAlign={ align }
						placeholderTextColor={
							styles.placeholderTextColor.color
						}
						identifier="text"
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
								isActive={ url }
							/>
						</ToolbarGroup>
					</BlockControls>
				) }

				{ this.getLinkSettings( false ) }

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
						{ this.getLinkSettings( true ) }
					</PanelBody>
				</InspectorControls>
			</View>
		);
	}
}

export default compose( [
	withInstanceId,
	withGradient,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withSelect( ( select, { clientId } ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		const {
			getSelectedBlockClientId,
			getBlockCount,
			getBlockRootClientId,
			getSettings,
		} = select( 'core/block-editor' );
		const { maxWidth } = getSettings();

		const parentId = getBlockRootClientId( clientId );
		const selectedId = getSelectedBlockClientId();
		const numOfButtons = getBlockCount( parentId );

		return {
			selectedId,
			editorSidebarOpened: isEditorSidebarOpened(),
			numOfButtons,
			maxWidth,
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
