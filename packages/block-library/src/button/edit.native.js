/**
 * External dependencies
 */
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

function RichTextWrapper( { children, gradientValue, borderRadiusValue, backgroundColor, defaultBackgroundColor } ) {
	const wrapperStyles = [
		styles.richTextWrapper,
		{
			borderRadius: borderRadiusValue,
			backgroundColor: backgroundColor.color || defaultBackgroundColor,
		},
	];

	function transformGradient() {
		const matchColorGroup = /(rgba|rgb|#)(.+?)[\%]/g;
		const matchDeg = /(\d.+)deg/g;

		const colorGroup = gradientValue.match( matchColorGroup ).map( ( color ) => color.split( ' ' ) );

		const colors = colorGroup.map( ( color ) => color[ 0 ] );
		const locations = colorGroup.map( ( location ) => Number( location[ 1 ].replace( '%', '' ) ) / 100 );
		const angle = Number( matchDeg.exec( gradientValue )[ 1 ] );

		return {
			colors, locations, angle,
		};
	}

	if ( gradientValue ) {
		const { colors, locations, angle } = transformGradient();
		return (
			<LinearGradient
				colors={ colors }
				useAngle={ true }
				angle={ angle }
				locations={ locations }
				angleCenter={ { x: 0.5, y: 0.5 } }
				style={ wrapperStyles }
			>
				{ children }
			</LinearGradient>
		);
	} return (
		<View
			style={ wrapperStyles }
		>
			{ children }
		</View>
	);
}

function ButtonEdit( { attributes, setAttributes, backgroundColor, textColor, isSelected } ) {
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

	const {
		gradientValue,
	} = __experimentalUseGradient();

	return (
		<View
			style={ [
				styles.container,
				isSelected && { borderColor: backgroundColor.color || defaultBackgroundColor, borderRadius: borderRadiusValue + 5, borderWidth: BORDER_WIDTH },
			] }
		>
			<RichTextWrapper
				gradientValue={ gradientValue }
				borderRadiusValue={ borderRadiusValue }
				backgroundColor={ backgroundColor }
				defaultBackgroundColor={ defaultBackgroundColor }
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
			</RichTextWrapper>
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
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( ButtonEdit );
