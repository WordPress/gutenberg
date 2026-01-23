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

/**
 * WordPress dependencies
 */
import {
	useLayoutEffect,
	useEffect,
	useRef,
	useState,
	useCallback,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BackgroundView from './background-view';
import getDefaultUseItems from './get-default-use-items';
import styles from './style.scss';
import Icon from '../icon';
import { __unstableAutocompletionItemsFill as AutocompletionItemsFill } from '../mobile/autocompletion-items';

const { compose: stylesCompose } = StyleSheet;

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
		reset,
	} ) {
		const [ items ] = useItems( filterValue );
		const filteredItems = items.filter( ( item ) => ! item.isDisabled );
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
			// We want to avoid introducing unexpected side effects.
			// See https://github.com/WordPress/gutenberg/pull/41820
		}, [ items, isVisible, text ] );

		const activeItemStyles = usePreferredColorSchemeStyle(
			styles[ 'components-autocomplete__item-active' ],
			styles[ 'components-autocomplete__item-active-dark' ]
		);

		const iconStyles = usePreferredColorSchemeStyle(
			styles[ 'components-autocomplete__icon' ],
			styles[ 'components-autocomplete__icon-active-dark' ]
		);

		const activeIconStyles = usePreferredColorSchemeStyle(
			styles[ 'components-autocomplete__icon-active ' ],
			styles[ 'components-autocomplete__icon-active-dark' ]
		);

		const textStyles = usePreferredColorSchemeStyle(
			styles[ 'components-autocomplete__text' ],
			styles[ 'components-autocomplete__text-dark' ]
		);

		const activeTextStyles = usePreferredColorSchemeStyle(
			styles[ 'components-autocomplete__text-active' ],
			styles[ 'components-autocomplete__text-active-dark' ]
		);

		const startAnimation = useCallback(
			( show ) => {
				Animated.timing( animationValue, {
					toValue: show ? 1 : 0,
					duration: show ? 200 : 100,
					useNativeDriver: true,
				} ).start( ( { finished } ) => {
					if ( finished && ! show && isVisible ) {
						setIsVisible( false );
						reset();
					}
				} );
			},
			// We want to avoid introducing unexpected side effects.
			// See https://github.com/WordPress/gutenberg/pull/41820
			[ isVisible ]
		);

		const contentStyles = {
			transform: [
				{
					translateY: animationValue.interpolate( {
						inputRange: [ 0, 1 ],
						outputRange: [
							styles[ 'components-autocomplete' ].height,
							0,
						],
					} ),
				},
			],
		};

		if ( ! filteredItems.length > 0 || ! isVisible ) {
			return null;
		}

		return (
			<AutocompletionItemsFill>
				<View style={ styles[ 'components-autocomplete' ] }>
					<Animated.View style={ contentStyles }>
						<BackgroundView>
							<ScrollView
								testID="autocompleter"
								ref={ scrollViewRef }
								horizontal
								contentContainerStyle={
									styles[ 'components-autocomplete__content' ]
								}
								showsHorizontalScrollIndicator={ false }
								keyboardShouldPersistTaps="always"
								accessibilityLabel={
									// translators: Slash inserter autocomplete results
									__( 'Slash inserter results' )
								}
							>
								{ filteredItems.map( ( option, index ) => {
									const isActive = index === selectedIndex;
									const itemStyle = stylesCompose(
										styles[
											'components-autocomplete__item'
										],
										isActive && activeItemStyles
									);
									const textStyle = stylesCompose(
										textStyles,
										isActive && activeTextStyles
									);
									const iconStyle = stylesCompose(
										iconStyles,
										isActive && activeIconStyles
									);
									const iconSource =
										option?.value?.icon?.src ||
										option?.value?.icon;

									return (
										<TouchableOpacity
											activeOpacity={ 0.5 }
											style={ itemStyle }
											key={ index }
											onPress={ () => onSelect( option ) }
											accessibilityLabel={ sprintf(
												// translators: %s: Block name e.g. "Image block"
												__( '%s block' ),
												option?.value?.title
											) }
										>
											<View
												style={
													styles[
														'components-autocomplete__icon'
													]
												}
											>
												<Icon
													icon={ iconSource }
													size={ 24 }
													style={ iconStyle }
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
