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
	InspectorControls,
	BlockControls,
	withGradient,
	store as blockEditorStore,
	getColorObjectByAttributeValues,
	getGradientValueBySlug,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
	LinkSettingsNavigation,
	BottomSheetSelectControl,
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

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_MAX_WIDTH = 108;
const MIN_WIDTH = 40;
// Map of the percentage width to pixel subtraction that make the buttons fit nicely into columns.
const MIN_WIDTH_MARGINS = {
	100: 0,
	75: styles.button75?.marginLeft,
	50: styles.button50?.marginLeft,
	25: styles.button25?.marginLeft,
};

function WidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		let width = selectedWidth === newWidth ? undefined : newWidth;
		if ( newWidth === 'auto' ) {
			width = undefined;
		}
		// Update attributes
		setAttributes( { width } );
	}

	const options = [
		{ value: 'auto', label: __( 'Auto' ) },
		{ value: 25, label: '25%' },
		{ value: 50, label: '50%' },
		{ value: 75, label: '75%' },
		{ value: 100, label: '100%' },
	];

	if ( ! selectedWidth ) {
		selectedWidth = 'auto';
	}

	return (
		<PanelBody title={ __( 'Width Settings' ) }>
			<BottomSheetSelectControl
				label={ __( 'Button width' ) }
				value={ selectedWidth }
				onChange={ handleChange }
				options={ options }
			/>
		</PanelBody>
	);
}

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
		this.onPlaceholderTextWidth = this.onPlaceholderTextWidth.bind( this );
		this.setRef = this.setRef.bind( this );
		this.onRemove = this.onRemove.bind( this );
		this.getPlaceholderWidth = this.getPlaceholderWidth.bind( this );

		this.state = {
			maxWidth: INITIAL_MAX_WIDTH,
			isLinkSheetVisible: false,
			isButtonFocused: true,
			placeholderTextWidth: 0,
		};

		this.linkSettingsActions = [
			{
				label: __( 'Remove link' ),
				onPress: this.onClearSettings,
			},
		];

		this.linkSettingsOptions = {
			url: {
				label: __( 'Button Link URL' ),
				placeholder: __( 'Add URL' ),
				autoFocus: true,
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

		this.noFocusLinkSettingOptions = {
			...this.linkSettingsOptions,
			url: {
				...this.linkSettingsOptions.url,
				autoFocus: false,
			},
		};
	}

	componentDidMount() {
		this.onSetMaxWidth();
	}

	componentDidUpdate( prevProps, prevState ) {
		const { isSelected, editorSidebarOpened, parentWidth } = this.props;
		const { isLinkSheetVisible, isButtonFocused } = this.state;

		if ( isSelected && ! prevProps.isSelected ) {
			this.onToggleButtonFocus( true );
		}

		if ( prevProps.parentWidth !== parentWidth ) {
			this.onSetMaxWidth( null, true );
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
			if ( ! isSelected && isButtonFocused ) {
				this.onToggleButtonFocus( false );
			}

			if ( isSelected && ! isButtonFocused ) {
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
		const { attributes, colors, gradients, mergedStyle } = this.props;
		const { backgroundColor, gradient } = attributes;

		// Return named gradient value if available.
		const gradientValue = getGradientValueBySlug( gradients, gradient );

		if ( gradientValue ) {
			return gradientValue;
		}

		const colorProps = getColorClassesAndStyles( attributes );

		// Retrieve named color object to force inline styles for themes that
		// do not load their color stylesheets in the editor.
		const colorObject = getColorObjectByAttributeValues(
			colors,
			backgroundColor
		);

		return (
			colorObject?.color ||
			colorProps.style?.backgroundColor ||
			colorProps.style?.background ||
			mergedStyle?.backgroundColor ||
			styles.defaultButton.backgroundColor
		);
	}

	getTextColor() {
		const { attributes, colors, mergedStyle } = this.props;
		const colorProps = getColorClassesAndStyles( attributes );

		// Retrieve named color object to force inline styles for themes that
		// do not load their color stylesheets in the editor.
		const colorObject = getColorObjectByAttributeValues(
			colors,
			attributes.textColor
		);

		return (
			colorObject?.color ||
			colorProps.style?.color ||
			mergedStyle?.color ||
			styles.defaultButton.color
		);
	}

	onChangeText( value ) {
		const { setAttributes } = this.props;
		setAttributes( { text: value } );
	}

	onChangeBorderRadius( newRadius ) {
		const { setAttributes, attributes } = this.props;
		const { style } = attributes;
		const newStyle = {
			...style,
			border: {
				...style?.border,
				radius: newRadius,
			},
		};

		setAttributes( { style: newStyle } );
	}

	onShowLinkSettings() {
		this.setState( { isLinkSheetVisible: true } );
	}

	onHideLinkSettings() {
		this.setState( { isLinkSheetVisible: false } );
	}

	onToggleButtonFocus( value ) {
		if ( value !== this.state.isButtonFocused ) {
			this.setState( { isButtonFocused: value } );
		}
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

	onSetMaxWidth( width, isParentWidthDidChange = false ) {
		const { maxWidth } = this.state;
		const { parentWidth } = this.props;
		const { marginRight: spacing } = styles.defaultButton;

		const isParentWidthChanged = isParentWidthDidChange
			? isParentWidthDidChange
			: maxWidth !== parentWidth;
		const isWidthChanged = maxWidth !== width;

		if ( parentWidth && ! width && isParentWidthChanged ) {
			this.setState( {
				maxWidth: parentWidth - spacing,
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
		return (
			<LinkSettingsNavigation
				isVisible={ isLinkSheetVisible }
				url={ attributes.url }
				rel={ attributes.rel }
				linkTarget={ attributes.linkTarget }
				onClose={ this.dismissSheet }
				setAttributes={ setAttributes }
				withBottomSheet={ ! isCompatibleWithSettings }
				hasPicker
				actions={ this.linkSettingsActions }
				options={
					isCompatibleWithSettings
						? this.linkSettingsOptions
						: this.noFocusLinkSettingOptions
				}
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
		return (
			<Text
				style={ styles.placeholder }
				onTextLayout={ this.onPlaceholderTextWidth }
			>
				{ placeholderText }
			</Text>
		);
	}

	onPlaceholderTextWidth( { nativeEvent } ) {
		const { maxWidth, placeholderTextWidth } = this.state;
		const textWidth =
			nativeEvent.lines[ 0 ] && nativeEvent.lines[ 0 ].width;

		if ( textWidth && textWidth !== placeholderTextWidth ) {
			this.setState( {
				placeholderTextWidth: Math.min( textWidth, maxWidth ),
			} );
		}
	}

	render() {
		const {
			attributes,
			isSelected,
			clientId,
			onReplace,
			mergeBlocks,
			parentWidth,
			setAttributes,
			mergedStyle,
		} = this.props;
		const {
			placeholder,
			text,
			style,
			url,
			align = 'center',
			width,
		} = attributes;
		const { maxWidth, isButtonFocused, placeholderTextWidth } = this.state;
		const { paddingTop: spacing, borderWidth } = styles.defaultButton;

		if ( parentWidth === 0 ) {
			return null;
		}

		const borderRadius = style?.border?.radius;

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
		let minWidth =
			isButtonFocused || ( ! isButtonFocused && text && text !== '' )
				? MIN_WIDTH
				: placeholderTextWidth;
		if ( width ) {
			// Set the width of the button.
			minWidth = Math.floor(
				maxWidth * ( width / 100 ) - MIN_WIDTH_MARGINS[ width ]
			);
		}
		// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
		// a `placeholder` as an empty string when `RichText` is focused,
		// because `AztecView` is calculating a `minWidth` based on placeholder text.
		const placeholderText =
			isButtonFocused || ( ! isButtonFocused && text && text !== '' )
				? ''
				: placeholder || __( 'Add text…' );

		const backgroundColor = this.getBackgroundColor();
		const textColor = this.getTextColor();
		const isFixedWidth = !! width;

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
							paddingLeft: isFixedWidth
								? 0
								: richTextStyle.richText.paddingLeft,
							paddingRight: isFixedWidth
								? 0
								: richTextStyle.richText.paddingRight,
							color: textColor,
						} }
						textAlign={ align }
						placeholderTextColor={
							mergedStyle?.color ||
							styles.placeholderTextColor.color
						}
						identifier="text"
						tagName="p"
						minWidth={ minWidth } // The minimum Button size.
						maxWidth={ isFixedWidth ? minWidth : maxWidth } // The width of the screen.
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
					<>
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
							<WidthPanel
								selectedWidth={ width }
								setAttributes={ setAttributes }
							/>
							<PanelBody title={ __( 'Link Settings' ) }>
								{ this.getLinkSettings( true ) }
							</PanelBody>
						</InspectorControls>
					</>
				) }
			</View>
		);
	}
}

export default compose( [
	withInstanceId,
	withGradient,
	withSelect( ( select, { clientId, isSelected } ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		const { getBlockCount, getBlockRootClientId, getSettings } = select(
			blockEditorStore
		);
		const parentId = getBlockRootClientId( clientId );
		const numOfButtons = getBlockCount( parentId );
		const settings = getSettings();

		return {
			colors: settings?.colors || [],
			gradients: settings?.gradients || [],
			editorSidebarOpened: isSelected && isEditorSidebarOpened(),
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
