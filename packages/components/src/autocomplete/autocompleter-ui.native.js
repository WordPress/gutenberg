/**
 * External dependencies
 */
import {
	View,
	Animated,
	StyleSheet,
	Text,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

/**
 * WordPress dependencies
 */
import {
	Platform,
	useLayoutEffect,
	useEffect,
	useRef,
	useState,
	useCallback,
} from '@wordpress/element';
import { Icon, AutocompletionItemsFill } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import getDefaultUseItems from './get-default-use-items';
import styles from './style.scss';

const { compose: stylesCompose } = StyleSheet;

const BackgroundView = ( { children, containerStyles } ) => {
	return Platform.OS === 'ios' ? (
		<BlurView
			style={ { height: 44 } }
			blurType="prominent"
			blurAmount={ 10 }
		>
			{ children }
		</BlurView>
	) : (
		<View style={ containerStyles }>{ children }</View>
	);
};

export function getAutoCompleterUI( autocompleter ) {
	const useItems = autocompleter.useItems
		? autocompleter.useItems
		: getDefaultUseItems( autocompleter );

	function AutocompleterUI( {
		filterValue,
		selectedIndex,
		onChangeOptions,
		onSelect,
		value,
	} ) {
		const [ items ] = useItems( filterValue );
		const scrollViewRef = useRef();
		const animationValue = useRef( new Animated.Value( 0 ) ).current;
		const [ isVisible, setIsVisible ] = useState( false );
		const { text } = value;

		useEffect( () => {
			if ( ! isVisible && text.length > 0 ) {
				setIsVisible( true );
			}
		}, [ isVisible, text ] );

		useLayoutEffect( () => {
			onChangeOptions( items );
			scrollViewRef.current?.scrollTo( { x: 0, animated: false } );

			if ( isVisible && text.length > 0 ) {
				startAnimation( true );
			} else if ( isVisible && text.length === 0 ) {
				startAnimation( false );
			}
		}, [ items, isVisible, text ] );

		const activeItemStyles = usePreferredColorSchemeStyle(
			styles.activeItem,
			styles.activeItemDark
		);

		const iconStyles = usePreferredColorSchemeStyle(
			styles.icon,
			styles.iconDark
		);

		const textStyles = usePreferredColorSchemeStyle(
			styles.text,
			styles.textDark
		);

		const activeTextStyles = usePreferredColorSchemeStyle(
			styles.activeText,
			styles.activeTextDark
		);

		const startAnimation = useCallback( ( show ) => {
			Animated.timing( animationValue, {
				toValue: show ? 1 : 0,
				duration: show ? 300 : 150,
				useNativeDriver: true,
			} ).start( ( { finished } ) => {
				if ( finished && ! show && isVisible ) {
					setIsVisible( false );
				}
			} );
		}, [] );

		const containerStyles = usePreferredColorSchemeStyle(
			styles.container,
			styles.containerDark
		);

		const contentStyles = {
			transform: [
				{
					translateY: animationValue.interpolate( {
						inputRange: [ 0, 1 ],
						outputRange: [ styles.wrapper.height, 0 ],
					} ),
				},
			],
		};

		if ( ! items.length > 0 || ! isVisible ) {
			return null;
		}

		return (
			<AutocompletionItemsFill>
				<View style={ styles.wrapper }>
					<Animated.View style={ contentStyles }>
						<BackgroundView containerStyles={ containerStyles }>
							<ScrollView
								ref={ scrollViewRef }
								horizontal
								contentContainerStyle={ styles.content }
								showsHorizontalScrollIndicator={ false }
								keyboardShouldPersistTaps="always"
							>
								{ items.map( ( option, index ) => {
									const isActive = index === selectedIndex;
									const itemStyle = stylesCompose(
										styles.item,
										isActive && activeItemStyles
									);
									const textStyle = stylesCompose(
										textStyles,
										isActive && activeTextStyles
									);

									return (
										<TouchableOpacity
											activeOpacity={ 0.5 }
											style={ itemStyle }
											key={ index }
											onPress={ () => onSelect( option ) }
										>
											<View style={ styles.icon }>
												<Icon
													icon={
														option?.value?.icon?.src
													}
													size={ 24 }
													style={ iconStyles }
												/>
											</View>
											<Text style={ textStyle }>
												{ option?.value?.title }
											</Text>
										</TouchableOpacity>
									);
								} ) }
							</ScrollView>
						</BackgroundView>
					</Animated.View>
				</View>
			</AutocompletionItemsFill>
		);
	}

	return AutocompleterUI;
}

export default getAutoCompleterUI;
