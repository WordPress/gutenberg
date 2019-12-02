/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';
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
} from '@wordpress/components';
import {
	useCallback,
	useState,
} from '@wordpress/element';

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

function ButtonEdit( { attributes, setAttributes, backgroundColor, textColor, isSelected } ) {
	const {
		placeholder,
		text,
		borderRadius,
		url,
		linkTarget,
		rel,
	} = attributes;

	const [ isFocused, setRichTextFocus ] = useState( false );

	const borderRadiusValue = borderRadius !== undefined ? borderRadius : INITIAL_BORDER_RADIUS;
	const mainColor = backgroundColor.color || '#2271b1';
	const outlineBorderRadius = borderRadiusValue + BLOCK_SPACING + BORDER_WIDTH;

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

	const {
		gradientValue,
	} = __experimentalUseGradient();

	const maxWidth = Dimensions.get( 'window' ).width - 74;
	const minWidth = isFocused || ( ! isFocused && text !== '' ) ? 1 : 108;
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
			</InspectorControls>
		</View>
	);
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( ButtonEdit );
