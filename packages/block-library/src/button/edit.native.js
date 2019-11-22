/**
 * External dependencies
 */
import { View } from 'react-native';
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
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	PanelBody,
	RangeControl,
} from '@wordpress/components';
import {
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import richTextStyle from './richText.scss';
import styles from './editor.scss';

const NEW_TAB_REL = 'noreferrer noopener';
const INITIAL_BORDER_RADIUS = 4;
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const BORDER_WIDTH = 1;

const ButtonEdit = ( { attributes, setAttributes, backgroundColor, textColor, isSelected } ) => {
	const {
		placeholder,
		text,
		borderRadius,
		url,
		linkTarget,
		rel,
	} = attributes;

	const borderRadiusValue = borderRadius || INITIAL_BORDER_RADIUS;
	const defaultBackgroundColor = '#2271b1';

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

	const changeAttribute = ( value ) => {
		setAttributes( {
			borderRadius: value,
		} );
	};

	return (
		<View
			style={ [
				styles.container,
				isSelected && { borderColor: backgroundColor.color || defaultBackgroundColor, borderRadius: borderRadiusValue + 5, borderWidth: BORDER_WIDTH },
			] }
		>
			<View
				style={ [
					styles.richTextWrapper,
					{
						borderRadius: borderRadiusValue,
						backgroundColor: backgroundColor.color || defaultBackgroundColor,
					},
				] }
			>
				<RichText
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					style={ {
						...richTextStyle.richText,
						color: textColor.color || '#fff',
					} }
					textAlign="center"
					placeholderTextColor="#668eaa"
				/>
			</View>
			<InspectorControls>
				<PanelBody title={ __( 'Border Settings' ) } >
					<RangeControl
						label={ __( 'Border Radius' ) }
						minimumValue={ MIN_BORDER_RADIUS_VALUE }
						maximumValue={ MAX_BORDER_RADIUS_VALUE }
						value={ borderRadiusValue }
						onChange={ changeAttribute }
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
};

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( ButtonEdit );
