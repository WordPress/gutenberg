/**
 * External dependencies
 */
import { View, AccessibilityInfo, Platform, Text } from 'react-native';
/**
 * WordPress dependencies
 */
import { withInstanceId, compose, usePrevious } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	withGradient,
	store as blockEditorStore,
	getColorObjectByAttributeValues,
	getGradientValueBySlug,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';
import { LinkSettingsNavigation } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import richTextStyle from './rich-text.scss';
import styles from './editor.scss';
import ColorBackground from './color-background';
import Controls from './controls';

const INITIAL_MAX_WIDTH = 108;
const MIN_WIDTH = 40;
// Map of the percentage width to pixel subtraction that make the buttons fit nicely into columns.
const MIN_WIDTH_MARGINS = {
	100: 0,
	75: styles.button75?.marginLeft,
	50: styles.button50?.marginLeft,
	25: styles.button25?.marginLeft,
};

const ButtonEdit = ( {
	attributes,
	colors,
	gradients,
	isSelected,
	clientId,
	onReplace,
	mergeBlocks,
	parentWidth,
	setAttributes,
	editorSidebarOpened,
	numOfButtons,
	onDeleteBlock,
	closeSettingsBottomSheet,
} ) => {
	const {
		placeholder,
		text,
		borderRadius,
		align = 'center',
		width,
		gradient,
	} = attributes;
	const [ maxWidth, setMaxWidth ] = useState( INITIAL_MAX_WIDTH );
	const [ isLinkSheetVisible, setIsLinkSheetVisible ] = useState( false );
	const [ isButtonFocused, setIsButtonFocused ] = useState( true );
	const [ placeholderTextWidth, setPlaceholderTextWidth ] = useState( 0 );
	const richTextRef = useRef( null );

	const prevParentWidth = usePrevious( parentWidth );
	const wasSelected = usePrevious( isSelected );
	const wasEditorSidebarOpened = usePrevious( editorSidebarOpened );
	const wasLinkSheetVisible = usePrevious( isLinkSheetVisible );

	const linkSettingsActions = [
		{
			label: __( 'Remove link' ),
			onPress: onClearSettings,
		},
	];

	const linkSettingsOptions = {
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

	const noFocusLinkSettingOptions = {
		...linkSettingsOptions,
		url: {
			...linkSettingsOptions.url,
			autoFocus: false,
		},
	};

	useEffect( () => {
		onSetMaxWidth();
	}, [] );

	useEffect( () => {
		if ( isSelected && ! wasSelected ) {
			onToggleButtonFocus( true );
		}

		if ( prevParentWidth !== parentWidth ) {
			onSetMaxWidth( null, true );
		}

		// Blur `RichText` on Android when link settings sheet or button settings sheet is opened,
		// to avoid flashing caret after closing one of them
		if (
			( ! wasEditorSidebarOpened && editorSidebarOpened ) ||
			( ! wasLinkSheetVisible && isLinkSheetVisible )
		) {
			if (
				Platform.OS === 'android' &&
				richTextRef &&
				richTextRef.current
			) {
				richTextRef.current.blur();
				onToggleButtonFocus( false );
			}
		}

		if ( richTextRef.current ) {
			if ( ! isSelected && isButtonFocused ) {
				onToggleButtonFocus( false );
			}

			if ( isSelected && ! isButtonFocused ) {
				AccessibilityInfo.isScreenReaderEnabled().then( ( enabled ) => {
					if ( enabled ) {
						onToggleButtonFocus( true );
						richTextRef.current.focus();
					}
				} );
			}
		}
	}, [
		isSelected,
		editorSidebarOpened,
		parentWidth,
		isLinkSheetVisible,
		isButtonFocused,
		wasSelected,
		wasEditorSidebarOpened,
		wasLinkSheetVisible,
		richTextRef.current,
	] );

	const setRef = ( nodeRef ) => {
		richTextRef.current = nodeRef;
	};

	const getBackgroundColor = () => {
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
			attributes.backgroundColor
		);

		return (
			colorObject?.color ||
			colorProps.style?.backgroundColor ||
			colorProps.style?.background ||
			styles.defaultButton.backgroundColor
		);
	};

	const getTextColor = () => {
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
			styles.defaultButton.color
		);
	};

	const onChangeText = ( value ) => {
		setAttributes( { text: value } );
	};

	const onChangeBorderRadius = ( value ) => {
		setAttributes( {
			borderRadius: value,
		} );
	};

	const onShowLinkSettings = () => {
		setIsLinkSheetVisible( true );
	};

	const onHideLinkSettings = () => {
		setIsLinkSheetVisible( false );
	};

	const onClearSettings = () => {
		setAttributes( {
			url: '',
			rel: '',
			linkTarget: '',
		} );

		onHideLinkSettings();
	};

	const onToggleButtonFocus = ( value ) => {
		if ( value !== isButtonFocused ) {
			setIsButtonFocused( value );
		}
	};

	const onLayout = ( { nativeEvent } ) => {
		const { layoutWidth } = nativeEvent.layout;
		onSetMaxWidth( layoutWidth );
	};

	const onSetMaxWidth = ( newWidth, isParentWidthDidChange = false ) => {
		const { marginRight: spacing } = styles.defaultButton;

		const isParentWidthChanged = isParentWidthDidChange
			? isParentWidthDidChange
			: maxWidth !== parentWidth;
		const isWidthChanged = maxWidth !== newWidth;

		if ( parentWidth && ! newWidth && isParentWidthChanged ) {
			setMaxWidth( parentWidth - spacing );
		} else if ( ! parentWidth && newWidth && isWidthChanged ) {
			setMaxWidth( newWidth - spacing );
		}
	};

	const onRemove = () => {
		if ( numOfButtons === 1 ) {
			onDeleteBlock();
		} else {
			onReplace( [] );
		}
	};

	const dismissSheet = () => {
		onHideLinkSettings();
		closeSettingsBottomSheet();
	};

	const getLinkSettings = ( isCompatibleWithSettings ) => {
		return (
			<LinkSettingsNavigation
				isVisible={ isLinkSheetVisible }
				url={ attributes.url }
				rel={ attributes.rel }
				linkTarget={ attributes.linkTarget }
				onClose={ dismissSheet }
				setAttributes={ setAttributes }
				withBottomSheet={ ! isCompatibleWithSettings }
				hasPicker
				actions={ linkSettingsActions }
				options={
					isCompatibleWithSettings
						? linkSettingsOptions
						: noFocusLinkSettingOptions
				}
				showIcon={ ! isCompatibleWithSettings }
			/>
		);
	};

	// Render `Text` with `placeholderText` styled as a placeholder
	// to calculate its width which then is set as a `minWidth`
	const getPlaceholderWidth = ( placeholderText ) => {
		return (
			<Text
				style={ styles.placeholder }
				onTextLayout={ onPlaceholderTextWidth }
			>
				{ placeholderText }
			</Text>
		);
	};

	const onPlaceholderTextWidth = ( { nativeEvent } ) => {
		const textWidth =
			nativeEvent.lines[ 0 ] && nativeEvent.lines[ 0 ].width;

		if ( textWidth && textWidth !== placeholderTextWidth ) {
			setPlaceholderTextWidth( Math.min( textWidth, maxWidth ) );
		}
	};

	const { paddingTop: spacing, borderWidth } = styles.defaultButton;

	if ( parentWidth === 0 ) {
		return null;
	}

	const borderRadiusValue = Number.isInteger( borderRadius )
		? borderRadius
		: styles.defaultButton.borderRadius;
	const outlineBorderRadius =
		borderRadiusValue > 0 ? borderRadiusValue + spacing + borderWidth : 0;

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

	const backgroundColor = getBackgroundColor();
	const textColor = getTextColor();
	const isFixedWidth = !! width;

	return (
		<View onLayout={ onLayout }>
			{ getPlaceholderWidth( placeholderText ) }
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
					setRef={ setRef }
					placeholder={ placeholderText }
					value={ text }
					onChange={ onChangeText }
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
					placeholderTextColor={ styles.placeholderTextColor.color }
					identifier="text"
					tagName="p"
					minWidth={ minWidth } // The minimum Button size.
					maxWidth={ isFixedWidth ? minWidth : maxWidth } // The width of the screen.
					id={ clientId }
					isSelected={ isButtonFocused }
					withoutInteractiveFormatting
					unstableOnFocus={ () => onToggleButtonFocus( true ) }
					__unstableMobileNoFocusOnMount={ ! isSelected }
					selectionColor={ textColor }
					onBlur={ () => {
						onSetMaxWidth();
					} }
					onReplace={ onReplace }
					onRemove={ onRemove }
					onMerge={ mergeBlocks }
				/>
			</ColorBackground>

			{ isSelected && (
				<Controls
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
					borderRadiusValue={ borderRadiusValue }
					getLinkSettings={ getLinkSettings }
					onShowLinkSettings={ onShowLinkSettings }
					onChangeBorderRadius={ onChangeBorderRadius }
				/>
			) }
		</View>
	);
};

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
