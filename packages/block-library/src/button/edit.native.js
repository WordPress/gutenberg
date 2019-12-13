/**
 * External dependencies
 */
import { View, InteractionManager } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	withInstanceId,
	compose,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	withColors,
	InspectorControls,
	__experimentalUseGradient,
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	PanelBody,
	RangeControl,
	MissingControl,
	NotificationSheet,
} from '@wordpress/components';
import {
	useCallback,
	useState,
	useEffect,
} from '@wordpress/element';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import richTextStyle from './richText.scss';
import styles from './editor.scss';
import RichTextWrapper from './richTextWrapper';

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_MAX_WIDTH = 108;

function ButtonEdit( { attributes, setAttributes, backgroundColor, textColor, isSelected, closeGeneralSidebar } ) {
	const {
		placeholder,
		text,
		borderRadius,
		url,
		linkTarget,
		rel,
	} = attributes;

	useEffect( () => {
		if ( this.richTextRef && isSelected ) {
			return this.richTextRef.focus();
		} return this.richTextRef.blur();
	} );

	const [ isFocused, setRichTextFocus ] = useState( true );
	const [ showHelp, setShowHelp ] = useState( false );
	const [ maxWidth, setMaxWidth ] = useState( INITIAL_MAX_WIDTH );

	const borderRadiusValue = borderRadius !== undefined ? borderRadius : styles.button.borderRadius;
	const outlineBorderRadius = borderRadiusValue > 0 ? borderRadiusValue + styles.button.paddingTop + styles.button.borderWidth : 0;

	const onChangeBackgroundColor = () => {
		if ( backgroundColor.color ) {
			// `backgroundColor` which should be set when we are able to resolve it
			return backgroundColor.color;
		} else if ( attributes.backgroundColor ) {
			// `backgroundColor` which should be set when we can’t resolve
			// the button `backgroundColor` that was created on web
			return styles.fallbackButton.backgroundColor;
		// `backgroundColor` which should be set when `Button` is created on mobile
		} return styles.button.backgroundColor;
	};

	const onToggleOpenInNewTab = useCallback(
		( value ) => {
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
		},
		[ rel, setAttributes ]
	);

	const setBorderRadius = ( value ) => {
		setAttributes( {
			borderRadius: value,
		} );
	};

	const toggleShowNoticationSheet = () => {
		setShowHelp( ! showHelp );
	};

	const openNotificationSheet = () => {
		closeGeneralSidebar();
		InteractionManager.runAfterInteractions( () => {
			toggleShowNoticationSheet();
		} );
	};

	const onLayout = ( { nativeEvent } ) => {
		const { width } = nativeEvent.layout;
		const { marginRight, paddingRight, borderWidth } = styles.button;
		const buttonSpacing = 2 * ( marginRight + paddingRight + borderWidth );
		setMaxWidth( width - buttonSpacing );
	};

	const {
		gradientValue,
	} = __experimentalUseGradient();

	// To achieve proper expanding and shrinking `RichText` on iOS, there is a need to set a `minWidth`
	// value at least on 1 when `RichText` is focused or when is not focused, but `RichText` value is
	// different than empty string.
	const minWidth = isFocused || ( ! isFocused && text && text !== '' ) ? 1 : styles.button.minWidth;
	// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
	// a `placeholder` as an empty string when `RichText` is focused,
	// because `AztecView` is calculating a `minWidth` based on placeholder text.
	const placeholderText = isFocused ? '' : ( placeholder || __( 'Add text…' ) );

	return (
		<View
			style={ { flex: 1 } }
			onLayout={ onLayout }
		>
			<View
				style={ [
					styles.container,
					isSelected && {
						borderColor: onChangeBackgroundColor(),
						borderRadius: outlineBorderRadius,
						borderWidth: styles.button.borderWidth,
					},
				] }
			>
				<RichTextWrapper
					gradientValue={ gradientValue }
					borderRadiusValue={ borderRadiusValue }
					backgroundColor={ onChangeBackgroundColor() }
				>
					<RichText
						setRef={ ( richText ) => {
							this.richTextRef = richText;
						} }
						placeholder={ placeholderText }
						value={ text }
						onChange={ ( value ) => setAttributes( { text: value } ) }
						style={ {
							...richTextStyle.richText,
							color: textColor.color || '#fff',
						} }
						textAlign="center"
						placeholderTextColor={ 'lightgray' }
						identifier="content"
						tagName="p"
						minWidth={ minWidth }
						maxWidth={ maxWidth }
						unstableOnFocus={ () => setRichTextFocus( true ) }
						onBlur={ () => setRichTextFocus( false ) }
					/>
				</RichTextWrapper>

				<InspectorControls>
					<PanelBody title={ __( 'Border Settings' ) } >
						<RangeControl
							label={ __( 'Border Radius' ) }
							minimumValue={ MIN_BORDER_RADIUS_VALUE }
							maximumValue={ MAX_BORDER_RADIUS_VALUE }
							value={ borderRadiusValue }
							onChange={ setBorderRadius }
							separatorType="none"
						/>
					</PanelBody>
					<PanelBody title={ __( 'Link Settings' ) } >
						<ToggleControl
							label={ __( 'Open in new tab' ) }
							checked={ linkTarget === '_blank' }
							onChange={ onToggleOpenInNewTab }
							separatorType="fullWidth"
						/>
						<TextControl
							label={ __( 'Link Rel' ) }
							value={ url || '' }
							valuePlaceholder={ __( 'Add URL' ) }
							onChange={ ( value ) => setAttributes( { url: value } ) }
							autoCapitalize="none"
							autoCorrect={ false }
							separatorType="none"
							keyboardType="url"
						/>
					</PanelBody>
					<PanelBody title={ __( 'Color Settings' ) } >
						<MissingControl
							label={ __( 'Coming Soon' ) }
							onChange={ openNotificationSheet }
							separatorType="none"
						/>
					</PanelBody>
				</InspectorControls>

				<NotificationSheet title="Color Settings" isVisible={ showHelp } onClose={ toggleShowNoticationSheet } type="plural" />
			</View>
		</View>
	);
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withDispatch( ( dispatch ) => {
		const { closeGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			closeGeneralSidebar,
		};
	} ),
] )( ButtonEdit );
