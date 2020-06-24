/**
 * External dependencies
 */
import { View, Animated, Easing, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useEffect, useState, useRef } from '@wordpress/element';
import {
	ToolbarGroup,
	ToolbarButton,
	LinkSettings,
} from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { link, Icon } from '@wordpress/icons';
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
	const { url, service } = attributes;
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

	// When new social icon is added link sheet is opened automatically
	useEffect( () => {
		if ( isSelected && ! url ) {
			setIsLinkSheetVisible( true );
		}
	}, [] );

	useEffect( () => {
		if ( ! url ) {
			setIsValue( false );
			animatedValue.setValue( 0 );
		} else if ( url ) {
			animateColors();
		}
	}, [ url ] );

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

	const options = {
		url: {
			label: __( 'URL' ),
			placeholder: __( 'Add URL' ),
			autoFocus: true,
		},
		linkLabel: {
			label: __( 'Link label' ),
			placeholder: __( 'None' ),
		},
		footer: {
			label: __( 'Briefly describe the link to help screen reader user' ),
		},
	};

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
		setIsLinkSheetVisible( false );
	}

	function onEmptyURL() {
		animatedValue.setValue( 0 );
		setIsValue( false );
	}

	function onIconPress() {
		if ( isSelected ) {
			setIsLinkSheetVisible( true );
		} else {
			onFocus();
		}
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
			<LinkSettings
				isVisible={ isLinkSheetVisible }
				attributes={ attributes }
				onEmptyURL={ onEmptyURL }
				onClose={ onCloseSettingsSheet }
				setAttributes={ setAttributes }
				options={ options }
				withBottomSheet={ true }
			/>
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
