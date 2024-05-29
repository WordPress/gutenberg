/**
 * External dependencies
 */
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';

/**
 * WordPress dependencies
 */
import {
	requestFocalPointPickerTooltipShown,
	setFocalPointPickerTooltipShown,
} from '@wordpress/react-native-bridge';
import { __ } from '@wordpress/i18n';
import { useRef, useState, useMemo, useEffect } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FocalPoint from './focal-point';
import Tooltip from './tooltip';
import styles from './style.scss';
import { isVideoType } from './utils';
import { clamp } from '../utils/math';
import Image from '../mobile/image';
import UnitControl from '../unit-control';

const MIN_POSITION_VALUE = 0;
const MAX_POSITION_VALUE = 100;
const FOCAL_POINT_UNITS = [ { default: 50, label: '%', value: '%' } ];

function FocalPointPicker( props ) {
	const { focalPoint, onChange, shouldEnableBottomSheetScroll, url } = props;

	const isVideo = isVideoType( url );

	const [ containerSize, setContainerSize ] = useState( null );
	const [ sliderKey, setSliderKey ] = useState( 0 );
	const [ displayPlaceholder, setDisplayPlaceholder ] = useState( true );
	const [ videoNaturalSize, setVideoNaturalSize ] = useState( null );
	const [ tooltipVisible, setTooltipVisible ] = useState( false );

	const locationPageOffsetX = useRef();
	const locationPageOffsetY = useRef();
	const videoRef = useRef( null );

	useEffect( () => {
		requestFocalPointPickerTooltipShown( ( tooltipShown ) => {
			if ( ! tooltipShown ) {
				setTooltipVisible( true );
				setFocalPointPickerTooltipShown( true );
			}
		} );
	}, [] );

	// Animated coordinates for drag handle.
	const pan = useRef( new Animated.ValueXY() ).current;

	/**
	 * Set drag handle position anytime focal point coordinates change.
	 * E.g. initial render, dragging range sliders.
	 */
	useEffect( () => {
		if ( containerSize ) {
			pan.setValue( {
				x: focalPoint.x * containerSize.width,
				y: focalPoint.y * containerSize.height,
			} );
		}
	}, [ focalPoint, containerSize, pan ] );

	// Pan responder to manage drag handle interactivity.
	const panResponder = useMemo(
		() =>
			PanResponder.create( {
				onStartShouldSetPanResponder: () => true,
				onStartShouldSetPanResponderCapture: () => true,
				onMoveShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponderCapture: () => true,

				onPanResponderGrant: ( event ) => {
					shouldEnableBottomSheetScroll( false );
					const {
						locationX: x,
						locationY: y,
						pageX,
						pageY,
					} = event.nativeEvent;
					locationPageOffsetX.current = pageX - x;
					locationPageOffsetY.current = pageY - y;
					pan.setValue( { x, y } ); // Set cursor to tap location.
					pan.extractOffset(); // Set offset to current value.
				},
				// Move cursor to match delta drag.
				onPanResponderMove: Animated.event(
					[ null, { dx: pan.x, dy: pan.y } ],
					{ useNativeDriver: false }
				),
				onPanResponderRelease: ( event ) => {
					shouldEnableBottomSheetScroll( true );
					pan.flattenOffset(); // Flatten offset into value.
					const { pageX, pageY } = event.nativeEvent;
					// Ideally, x and y below are merely locationX and locationY from the
					// nativeEvent. However, we are required to compute these relative
					// coordinates to workaround a bug affecting Android's PanResponder.
					// Specifically, dragging the handle outside the bounds of the image
					// results in inaccurate locationX and locationY coordinates to be
					// reported. https://github.com/facebook/react-native/issues/15290#issuecomment-435494944
					const x = pageX - locationPageOffsetX.current;
					const y = pageY - locationPageOffsetY.current;
					onChange( {
						x: clamp( x / containerSize?.width, 0, 1 ).toFixed( 2 ),
						y: clamp( y / containerSize?.height, 0, 1 ).toFixed(
							2
						),
					} );
					// Slider (child of RangeCell) is uncontrolled, so we must increment a
					// key to re-mount and sync the pan gesture values to the sliders
					// https://github.com/callstack/react-native-slider/tree/v3.0.3#value
					setSliderKey( ( prevState ) => prevState + 1 );
				},
			} ),
		[ containerSize, pan, onChange, shouldEnableBottomSheetScroll ]
	);

	const mediaBackground = usePreferredColorSchemeStyle(
		styles.mediaBackground,
		styles.mediaBackgroundDark
	);
	const imagePreviewStyles = [
		displayPlaceholder && styles.mediaPlaceholder,
		styles.image,
	];
	const videoPreviewStyles = [
		{
			aspectRatio:
				videoNaturalSize &&
				videoNaturalSize.width / videoNaturalSize.height,
			// Hide Video component since it has black background while loading the source
			opacity: displayPlaceholder ? 0 : 1,
		},
		styles.video,
		displayPlaceholder && styles.mediaPlaceholder,
	];
	const focalPointGroupStyles = [
		styles.focalPointGroup,
		{
			transform: [
				{
					translateX: pan.x.interpolate( {
						inputRange: [ 0, containerSize?.width || 0 ],
						outputRange: [ 0, containerSize?.width || 0 ],
						extrapolate: 'clamp',
					} ),
				},
				{
					translateY: pan.y.interpolate( {
						inputRange: [ 0, containerSize?.height || 0 ],
						outputRange: [ 0, containerSize?.height || 0 ],
						extrapolate: 'clamp',
					} ),
				},
			],
		},
	];
	const FOCAL_POINT_SIZE = 50;
	const focalPointStyles = StyleSheet.flatten( [
		styles.focalPoint,
		{
			height: FOCAL_POINT_SIZE,
			marginLeft: -( FOCAL_POINT_SIZE / 2 ),
			marginTop: -( FOCAL_POINT_SIZE / 2 ),
			width: FOCAL_POINT_SIZE,
		},
	] );

	const onTooltipPress = () => setTooltipVisible( false );
	const onMediaLayout = ( event ) => {
		const { height, width } = event.nativeEvent.layout;

		if (
			width !== 0 &&
			height !== 0 &&
			( containerSize?.width !== width ||
				containerSize?.height !== height )
		) {
			setContainerSize( { width, height } );
		}
	};
	const onImageDataLoad = () => setDisplayPlaceholder( false );
	const onVideoLoad = ( event ) => {
		const { height, width } = event.naturalSize;
		setVideoNaturalSize( { height, width } );
		setDisplayPlaceholder( false );
		// Avoid invisible, paused video on Android, presumably related to
		// https://github.com/react-native-video/react-native-video/issues/1979
		videoRef?.current.seek( 0 );
	};
	const onXCoordinateChange = ( x ) =>
		onChange( { x: ( x / 100 ).toFixed( 2 ) } );
	const onYCoordinateChange = ( y ) =>
		onChange( { y: ( y / 100 ).toFixed( 2 ) } );

	return (
		<View style={ styles.container }>
			<Tooltip onPress={ onTooltipPress } visible={ tooltipVisible }>
				<View style={ [ styles.media, mediaBackground ] }>
					<View
						{ ...panResponder.panHandlers }
						onLayout={ onMediaLayout }
						style={ styles.mediaContainer }
					>
						{ ! isVideo && (
							<Image
								editButton={ false }
								highlightSelected={ false }
								isSelected={ ! displayPlaceholder }
								height="100%"
								url={ url }
								style={ imagePreviewStyles }
								onImageDataLoad={ onImageDataLoad }
							/>
						) }
						{ isVideo && (
							<Video
								muted
								paused
								disableFocus
								onLoad={ onVideoLoad }
								ref={ videoRef }
								resizeMode="contain"
								source={ { uri: url } }
								style={ videoPreviewStyles }
							/>
						) }
						{ ! displayPlaceholder && (
							<Animated.View
								pointerEvents="none"
								style={ focalPointGroupStyles }
							>
								<Tooltip.Label
									text={ __( 'Drag to adjust focal point' ) }
									yOffset={ -( FOCAL_POINT_SIZE / 2 ) }
								/>
								<FocalPoint
									height={ focalPointStyles.height }
									style={ focalPointStyles }
									testID="focal-point-picker-handle"
									width={ focalPointStyles.width }
								/>
							</Animated.View>
						) }
					</View>
				</View>
				<UnitControl
					key={ `xAxis-${ sliderKey }` }
					label={ __( 'X-Axis Position' ) }
					max={ MAX_POSITION_VALUE }
					min={ MIN_POSITION_VALUE }
					onChange={ onXCoordinateChange }
					unit="%"
					units={ FOCAL_POINT_UNITS }
					value={ Math.round( focalPoint.x * 100 ) }
				/>
				<UnitControl
					key={ `yAxis-${ sliderKey }` }
					label={ __( 'Y-Axis Position' ) }
					max={ MAX_POSITION_VALUE }
					min={ MIN_POSITION_VALUE }
					onChange={ onYCoordinateChange }
					unit="%"
					units={ FOCAL_POINT_UNITS }
					value={ Math.round( focalPoint.y * 100 ) }
				/>
			</Tooltip>
		</View>
	);
}

export default FocalPointPicker;
