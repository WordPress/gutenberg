/**
 * External dependencies
 */
import { View, Dimensions, InteractionManager } from 'react-native';
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
} from '@wordpress/element';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import richTextStyle from './richText.scss';
import styles from './editor.scss';
import RichTextWrapper from './richTextWrapper';

const NEW_TAB_REL = 'noreferrer noopener';
const INITIAL_BORDER_RADIUS = 4;
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const BORDER_WIDTH = 1;
const BLOCK_SPACING = 4;

function ButtonEdit( { attributes, setAttributes, backgroundColor, textColor, isSelected, closeGeneralSidebar } ) {
	const {
		placeholder,
		text,
		borderRadius,
		url,
		linkTarget,
		rel,
	} = attributes;

	const [ isFocused, setRichTextFocus ] = useState( true );
	const [ showHelp, setShowHelp ] = useState( false );

	const borderRadiusValue = borderRadius !== undefined ? borderRadius : INITIAL_BORDER_RADIUS;
	const mainColor = backgroundColor.color || '#595959';
	const outlineBorderRadius = borderRadiusValue > 0 ? borderRadiusValue + BLOCK_SPACING + BORDER_WIDTH : 0;

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

	const {
		gradientValue,
	} = __experimentalUseGradient();

	// 2 * container padding (32) + 2 * rich text padding (32) + 2 * BLOCK_SPACING (8) + 2 * BORDER_WIDTH = 74
	// 580 is a max width when screen has horizontal orientation. Value comes from `ReadableContentView` styles.
	const maxWidth = Math.min( Dimensions.get( 'window' ).width - 74, 580 - 74 );
	// To achieve proper expanding and shrinking `RichText` on iOS, there is a need to set a `minWidth`
	// value at least on 1 when `RichText` is focused or when is not focused, but `RichText` value is
	// different than empty string.
	const minWidth = isFocused || ( ! isFocused && text && text !== '' ) ? 1 : 108;
	// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
	// a `placeholder` as an empty string when `RichText` is focused,
	// because `AztecView` is calculating a `minWidth` based on placeholder text.
	const placeholderText = isFocused ? '' : ( placeholder || __( 'Add text…' ) );

	return (
		<View
			style={ [
				styles.container,
				isSelected && {
					borderColor: mainColor,
					borderRadius: outlineBorderRadius,
					borderWidth: BORDER_WIDTH,
				},
			] }
		>
			<RichTextWrapper
				gradientValue={ gradientValue }
				borderRadiusValue={ borderRadiusValue }
				backgroundColor={ mainColor }
			>
				<RichText
					placeholder={ placeholderText }
					value={ text }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					style={ {
						...richTextStyle.richText,
						color: textColor.color || '#fff',
					} }
					textAlign="center"
					placeholderTextColor={ 'lightgray' }
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
						onPress={ openNotificationSheet }
						separatorType="none"
					/>
				</PanelBody>
			</InspectorControls>
			<NotificationSheet title="Color Settings" isVisible={ showHelp } onClose={ toggleShowNoticationSheet } type="plural" />
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
