/**
 * External dependencies
 */
import { View } from 'react-native';
import Video from 'react-native-video';

/**
 * WordPress dependencies
 */
import {
	Image,
	Icon,
	IMAGE_DEFAULT_FOCAL_POINT,
	PanelBody,
	RangeControl,
	UnitControl,
	TextControl,
	BottomSheet,
	ToggleControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { useState, useCallback, useRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useSetting, MediaUpload } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import OverlayColorSettings from './overlay-color-settings';
import FocalPointSettingsButton from './focal-point-settings-button';
import {
	ALLOWED_MEDIA_TYPES,
	COVER_MIN_HEIGHT,
	COVER_MAX_HEIGHT,
	COVER_DEFAULT_HEIGHT,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
} from './shared';

function Controls( {
	attributes,
	didUploadFail,
	hasOnlyColorBackground,
	isUploadInProgress,
	onClearMedia,
	onSelectMedia,
	setAttributes,
} ) {
	const {
		backgroundType,
		dimRatio,
		hasParallax,
		focalPoint,
		minHeight,
		minHeightUnit = 'px',
		url,
	} = attributes;
	const CONTAINER_HEIGHT = minHeight || COVER_DEFAULT_HEIGHT;
	const onHeightChange = useCallback(
		( value ) => {
			if ( minHeight || value !== COVER_DEFAULT_HEIGHT ) {
				setAttributes( { minHeight: value } );
			}
		},
		[ minHeight ]
	);

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
		defaultValues: { px: 430, em: 20, rem: 20, vw: 20, vh: 50 },
	} );

	const onOpacityChange = useCallback( ( value ) => {
		setAttributes( { dimRatio: value } );
	}, [] );

	const onChangeUnit = useCallback( ( nextUnit ) => {
		setAttributes( {
			minHeightUnit: nextUnit,
			minHeight:
				nextUnit === 'px'
					? Math.max( CONTAINER_HEIGHT, COVER_MIN_HEIGHT )
					: CONTAINER_HEIGHT,
		} );
	}, [] );

	const [ displayPlaceholder, setDisplayPlaceholder ] = useState( true );

	function setFocalPoint( value ) {
		setAttributes( { focalPoint: value } );
	}

	const toggleParallax = () => {
		setAttributes( {
			hasParallax: ! hasParallax,
			...( ! hasParallax
				? { focalPoint: undefined }
				: { focalPoint: IMAGE_DEFAULT_FOCAL_POINT } ),
		} );
	};

	const addMediaButtonStyle = usePreferredColorSchemeStyle(
		styles.addMediaButton,
		styles.addMediaButtonDark
	);

	function focalPointPosition( { x, y } = IMAGE_DEFAULT_FOCAL_POINT ) {
		return {
			left: `${ ( hasParallax ? 0.5 : x ) * 100 }%`,
			top: `${ ( hasParallax ? 0.5 : y ) * 100 }%`,
		};
	}

	const [ videoNaturalSize, setVideoNaturalSize ] = useState( null );
	const videoRef = useRef( null );

	const mediaBackground = usePreferredColorSchemeStyle(
		styles.mediaBackground,
		styles.mediaBackgroundDark
	);
	const imagePreviewStyles = [
		displayPlaceholder && styles.imagePlaceholder,
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
		displayPlaceholder && styles.imagePlaceholder,
	];

	const focalPointHint = ! hasParallax && ! displayPlaceholder && (
		<Icon
			icon={ plus }
			size={ styles.focalPointHint?.width }
			style={ [
				styles.focalPointHint,
				focalPointPosition( focalPoint ),
			] }
		/>
	);

	const renderMediaSection = ( {
		open: openMediaOptions,
		getMediaOptions,
	} ) => (
		<>
			{ getMediaOptions() }
			{ url ? (
				<>
					<BottomSheet.Cell
						accessible={ false }
						cellContainerStyle={ [
							styles.mediaPreview,
							mediaBackground,
						] }
						onLongPress={ openMediaOptions }
					>
						<View style={ styles.mediaInner }>
							{ IMAGE_BACKGROUND_TYPE === backgroundType && (
								<Image
									editButton={ ! displayPlaceholder }
									highlightSelected={ false }
									isSelected={ ! displayPlaceholder }
									isUploadFailed={ didUploadFail }
									isUploadInProgress={ isUploadInProgress }
									mediaPickerOptions={ [
										{
											destructiveButton: true,
											id: 'clearMedia',
											label: __( 'Clear Media' ),
											onPress: onClearMedia,
											separated: true,
											value: 'clearMedia',
										},
									] }
									onImageDataLoad={ () => {
										setDisplayPlaceholder( false );
									} }
									onSelectMediaUploadOption={ onSelectMedia }
									openMediaOptions={ openMediaOptions }
									url={ url }
									height="100%"
									style={ imagePreviewStyles }
									width={ styles.image?.width }
								/>
							) }
							{ VIDEO_BACKGROUND_TYPE === backgroundType && (
								<Video
									muted
									paused
									disableFocus
									onLoadStart={ () => {
										setDisplayPlaceholder( true );
									} }
									onLoad={ ( event ) => {
										const {
											height,
											width,
										} = event.naturalSize;
										setVideoNaturalSize( {
											height,
											width,
										} );
										setDisplayPlaceholder( false );
										// Avoid invisible, paused video on Android, presumably
										// related to https://git.io/Jt6Dr
										videoRef?.current.seek( 0 );
									} }
									ref={ videoRef }
									resizeMode={ 'cover' }
									source={ { uri: url } }
									style={ videoPreviewStyles }
								/>
							) }
							{ displayPlaceholder ? null : focalPointHint }
						</View>
					</BottomSheet.Cell>
					<FocalPointSettingsButton
						disabled={ hasParallax }
						focalPoint={ focalPoint || IMAGE_DEFAULT_FOCAL_POINT }
						onFocalPointChange={ setFocalPoint }
						url={ url }
					/>
					{ IMAGE_BACKGROUND_TYPE === backgroundType && (
						<ToggleControl
							label={ __( 'Fixed background' ) }
							checked={ hasParallax }
							onChange={ toggleParallax }
						/>
					) }
					<TextControl
						leftAlign
						label={ __( 'Clear Media' ) }
						labelStyle={ styles.clearMediaButton }
						onPress={ onClearMedia }
					/>
				</>
			) : (
				<TextControl
					accessibilityLabel={ __( 'Add image or video' ) }
					label={ __( 'Add image or video' ) }
					labelStyle={ addMediaButtonStyle }
					leftAlign
					onPress={ openMediaOptions }
				/>
			) }
		</>
	);

	return (
		<>
			<PanelBody title={ __( 'Media' ) }>
				<MediaUpload
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					isReplacingMedia={ ! hasOnlyColorBackground }
					onSelect={ onSelectMedia }
					render={ renderMediaSection }
				/>
			</PanelBody>

			<OverlayColorSettings
				overlayColor={ attributes.overlayColor }
				customOverlayColor={ attributes.customOverlayColor }
				gradient={ attributes.gradient }
				customGradient={ attributes.customGradient }
				setAttributes={ setAttributes }
			/>

			{ url ? (
				<PanelBody>
					<RangeControl
						label={ __( 'Opacity' ) }
						minimumValue={ 0 }
						maximumValue={ 100 }
						value={ dimRatio }
						onChange={ onOpacityChange }
						style={ styles.rangeCellContainer }
						separatorType={ 'topFullWidth' }
					/>
				</PanelBody>
			) : null }

			<PanelBody title={ __( 'Dimensions' ) }>
				<UnitControl
					label={ __( 'Minimum height' ) }
					min={ minHeightUnit === 'px' ? COVER_MIN_HEIGHT : 1 }
					max={ COVER_MAX_HEIGHT }
					unit={ minHeightUnit }
					value={ CONTAINER_HEIGHT }
					onChange={ onHeightChange }
					onUnitChange={ onChangeUnit }
					units={ units }
					style={ styles.rangeCellContainer }
					key={ minHeightUnit }
				/>
			</PanelBody>
		</>
	);
}

export default Controls;
