/**
 * External dependencies
 */
import {
	View,
	TouchableWithoutFeedback,
	Text,
	Platform,
	LayoutAnimation,
	Animated,
	Easing,
} from 'react-native';
import { take, values, map, reduce } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const ANIMATION_DURATION = 200;

const isIOS = Platform.OS === 'ios';

const Segment = ( { isSelected, title, onPress, onLayout } ) => {
	const isSelectedIOS = isIOS && isSelected;

	const segmentStyle = [ styles.segment, isIOS && styles.segmentIOS ];

	const textStyle = usePreferredColorSchemeStyle(
		styles.buttonTextDefault,
		styles.buttonTextDefaultDark
	);
	const selectedTextStyle = usePreferredColorSchemeStyle(
		styles.buttonTextSelected,
		styles.buttonTextSelectedDark
	);
	const shadowStyle = usePreferredColorSchemeStyle( styles.shadowIOS, {} );

	return (
		<View style={ isSelectedIOS && shadowStyle }>
			<TouchableWithoutFeedback onPress={ onPress }>
				<View style={ segmentStyle } onLayout={ onLayout }>
					<Text
						style={ [ textStyle, isSelected && selectedTextStyle ] }
						maxFontSizeMultiplier={ 2 }
					>
						{ title }
					</Text>
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
};

const SegmentedControls = ( {
	segments,
	segmentHandler,
	selectedIndex,
	addonLeft,
	addonRight,
} ) => {
	const selectedSegmentIndex = selectedIndex || 0;
	const [ activeSegmentIndex, setActiveSegmentIndex ] = useState(
		selectedSegmentIndex
	);
	const [ segmentsDimensions, setSegmentsDimensions ] = useState( {
		[ activeSegmentIndex ]: { width: 0, height: 0 },
	} );
	const [ positionAnimationValue ] = useState( new Animated.Value( 0 ) );

	useEffect( () => {
		setActiveSegmentIndex( selectedSegmentIndex );
		segmentHandler( segments[ selectedSegmentIndex ] );
	}, [] );

	useEffect( () => {
		positionAnimationValue.setValue(
			calculateEndValue( activeSegmentIndex )
		);
	}, [ segmentsDimensions ] );

	const containerStyle = usePreferredColorSchemeStyle(
		styles.container,
		styles.containerDark
	);

	function performAnimation( index ) {
		Animated.timing( positionAnimationValue, {
			toValue: calculateEndValue( index ),
			duration: ANIMATION_DURATION,
			easing: Easing.ease,
		} ).start();
	}

	function calculateEndValue( index ) {
		const { paddingLeft: offset } = isIOS
			? styles.containerIOS
			: styles.container;
		const widths = map( values( segmentsDimensions ), 'width' );
		const widthsDistance = take( widths, index );
		const widthsDistanceSum = reduce(
			widthsDistance,
			( sum, n ) => sum + n
		);

		const endValue = index === 0 ? 0 : widthsDistanceSum;
		return endValue + offset;
	}

	function onHandlePress( segment, index ) {
		LayoutAnimation.configureNext(
			LayoutAnimation.create(
				ANIMATION_DURATION,
				LayoutAnimation.Types.easeInEaseOut,
				LayoutAnimation.Properties.opacity
			)
		);
		setActiveSegmentIndex( index );
		segmentHandler( segment );
		performAnimation( index, segment );
	}

	function segmentOnLayout( event, index ) {
		const { width, height } = event.nativeEvent.layout;

		setSegmentsDimensions( {
			...segmentsDimensions,
			[ index ]: { width, height },
		} );
	}

	const selectedStyle = usePreferredColorSchemeStyle(
		styles.selected,
		styles.selectedDark
	);

	const width = segmentsDimensions[ activeSegmentIndex ].width;
	const height = segmentsDimensions[ activeSegmentIndex ].height;

	const outlineStyle = [ styles.outline, isIOS && styles.outlineIOS ];

	return (
		<View style={ styles.row }>
			<View style={ styles.flex }>{ addonLeft }</View>
			<View style={ [ containerStyle, isIOS && styles.containerIOS ] }>
				{ segments.map( ( segment, index ) => {
					return (
						<Segment
							title={ segment }
							onPress={ () => onHandlePress( segment, index ) }
							isSelected={ activeSegmentIndex === index }
							key={ index }
							onLayout={ ( event ) =>
								segmentOnLayout( event, index )
							}
						/>
					);
				} ) }
				<Animated.View
					style={ [
						{
							width,
							left: positionAnimationValue,
							height,
						},
						selectedStyle,
						outlineStyle,
					] }
				/>
			</View>
			<View style={ styles.flex }>{ addonRight }</View>
		</View>
	);
};

export default SegmentedControls;
