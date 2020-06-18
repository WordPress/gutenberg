/**
 * External dependencies
 */
import {
	View,
	Platform,
	Animated,
	Easing,
	TouchableWithoutFeedback,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useEffect, useState, useRef } from '@wordpress/element';
import {
	PanelBody,
	TextControl,
	ToolbarGroup,
	BottomSheet,
	ToolbarButton,
	UnsupportedFooterControl,
} from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { link, Icon } from '@wordpress/icons';
import { prependHTTP } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';
import styles from './editor.scss';

const ANIMATION_DELAY = 300;
const ANIMATION_DURATION = 400;

const SocialLinkEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	onFocus,
} ) => {
	const { url, service, label } = attributes;
	const activeIcon =
		styles[ `wp-social-link-${ service }` ] || styles[ `wp-social-link` ];

	const inactiveIcon = usePreferredColorSchemeStyle(
		styles.inactiveIcon,
		styles.inactiveIconDark
	);

	const [ isLinkSheetVisible, setIsLinkSheetVisible ] = useState( false );
	const [ isValue, setIsValue ] = useState( !! url );

	const animatedValue = useRef( new Animated.Value( 0 ) ).current;

	const IconComponent = getIconBySite( service )();
	const socialLinkName = getNameBySite( service );

	useEffect( () => {
		if ( isSelected && ! url ) {
			setIsLinkSheetVisible( true );
		}
	}, [] );

	useEffect( () => {
		setAttributes( { url: prependHTTP( url ) } );
	}, [ ! isLinkSheetVisible && url ] );

	const interpolationColors = {
		backgroundColor: animatedValue.interpolate( {
			inputRange: [ 0, 1 ],
			outputRange: [
				inactiveIcon.backgroundColor,
				activeIcon.backgroundColor,
			],
		} ),
		color: animatedValue.interpolate( {
			inputRange: [ 0, 1 ],
			outputRange: [ inactiveIcon.color, activeIcon.color ],
		} ),
		stroke: '',
	};

	const { backgroundColor, color, stroke } = isValue
		? activeIcon
		: interpolationColors;

	function onChangeURL( value ) {
		if ( value === '' ) {
			setIsValue( false );
			animatedValue.setValue( 0 );
		}
		setAttributes( { url: value } );
	}

	function onChangeLabel( value ) {
		setAttributes( { label: value } );
	}

	function animateColors() {
		Animated.sequence( [
			Animated.delay( ANIMATION_DELAY ),
			Animated.timing( animatedValue, {
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.circle,
			} ),
		] ).start( () => setIsValue( true ) );
	}

	function onCloseSettingsSheet() {
		if ( url ) {
			animateColors();
		}
		setIsLinkSheetVisible( false );
	}

	function onIconPress() {
		if ( isSelected ) {
			setIsLinkSheetVisible( true );
		} else {
			onFocus();
		}
	}

	function getLinkSettings( isCompatibleWithSettings = true ) {
		return (
			<>
				<PanelBody
					title={
						isCompatibleWithSettings &&
						sprintf(
							/* translators: %s: name of the social service. */
							__( '%s label' ),
							socialLinkName
						)
					}
					style={
						! isCompatibleWithSettings && styles.linkSettingsPanel
					}
				>
					<TextControl
						label={ __( 'URL' ) }
						value={ url || '' }
						valuePlaceholder={ __( 'Add URL' ) }
						onChange={ onChangeURL }
						onSubmit={ onCloseSettingsSheet }
						autoCapitalize="none"
						autoCorrect={ false }
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus={ Platform.OS === 'ios' }
						keyboardType="url"
					/>
					<TextControl
						label={ __( 'Link label' ) }
						value={ label || '' }
						valuePlaceholder={ __( 'None' ) }
						onChange={ onChangeLabel }
					/>
				</PanelBody>
				<PanelBody
					style={
						! isCompatibleWithSettings && styles.linkSettingsPanel
					}
				>
					<UnsupportedFooterControl
						label={ __(
							'Briefly describe the link to help screen reader user'
						) }
					></UnsupportedFooterControl>
				</PanelBody>
			</>
		);
	}

	return (
		<View>
			{ isSelected && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							title={ sprintf(
								// translators: %s: social link name e.g: "Instagram".
								__( 'Add link to %s' ),
								socialLinkName
							) }
							icon={ link }
							onClick={ () => setIsLinkSheetVisible( true ) }
							isActive={ url }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			<BottomSheet
				isVisible={ isLinkSheetVisible }
				onClose={ onCloseSettingsSheet }
				hideHeader
			>
				{ getLinkSettings( false ) }
			</BottomSheet>
			<TouchableWithoutFeedback onPress={ onIconPress }>
				<Animated.View
					style={ [ styles.iconContainer, { backgroundColor } ] }
				>
					<Icon icon={ IconComponent } style={ { stroke, color } } />
				</Animated.View>
			</TouchableWithoutFeedback>
		</View>
	);
};

export default SocialLinkEdit;
