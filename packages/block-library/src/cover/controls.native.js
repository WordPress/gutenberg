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
	BottomSheet,
	ToggleControl,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import OverlayColorSettings from './overlay-color-settings';
import FocalPointSettings from './focal-point-settings';
import {
	COVER_MIN_HEIGHT,
	COVER_MAX_HEIGHT,
	COVER_DEFAULT_HEIGHT,
	CSS_UNITS,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
} from './shared';

function Controls( {
	attributes,
	didUploadFail,
	isUploadInProgress,
	onClearMedia,
	onSelectMedia,
	openMediaOptionsRef,
	setAttributes,
} ) {
	const {
		backgroundColor,
		backgroundType,
		dimRatio,
		hasParallax,
		focalPoint,
		minHeight,
		minHeightUnit = 'px',
		url,
	} = attributes;
	const CONTAINER_HEIGHT = minHeight || COVER_DEFAULT_HEIGHT;
	const onHeightChange = ( value ) => {
		if ( minHeight || value !== COVER_DEFAULT_HEIGHT ) {
			setAttributes( { minHeight: value } );
		}
	};

	const onOpacityChange = ( value ) => {
		setAttributes( { dimRatio: value } );
	};

	const onChangeUnit = ( nextUnit ) => {
		setAttributes( {
			minHeightUnit: nextUnit,
			minHeight:
				nextUnit === 'px'
					? Math.max( CONTAINER_HEIGHT, COVER_MIN_HEIGHT )
					: CONTAINER_HEIGHT,
		} );
	};

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

	const imagePreviewStyles = [
		displayPlaceholder && styles.imagePlaceholder,
	];
	const videoPreviewStyles = [
		{
			aspectRatio:
				videoNaturalSize &&
				videoNaturalSize.width / videoNaturalSize.height,
			height: '100%',
		},
		! displayPlaceholder && styles.video,
		displayPlaceholder && styles.imagePlaceholder,
	];

	const focalPointHint = ! hasParallax && ! displayPlaceholder && (
		<Icon
			icon={ plus }
			size={ styles.focalPointHint.width }
			style={ [
				styles.focalPointHint,
				focalPointPosition( focalPoint ),
			] }
		/>
	);

	return (
		<InspectorControls>
			<OverlayColorSettings
				attributes={ attributes }
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
					units={ CSS_UNITS }
					style={ styles.rangeCellContainer }
					key={ `${ minHeightUnit }-${ minHeight }` }
				/>
			</PanelBody>

			<PanelBody title={ __( 'Media' ) }>
				{ url ? (
					<>
						<BottomSheet.Cell
							style={ backgroundColor }
							cellContainerStyle={ styles.mediaPreview }
						>
							<View style={ styles.mediaInner }>
								{ IMAGE_BACKGROUND_TYPE === backgroundType && (
									<Image
										editButton={ ! displayPlaceholder }
										isSelected={ ! displayPlaceholder }
										isUploadFailed={ didUploadFail }
										isUploadInProgress={
											isUploadInProgress
										}
										onImageDataLoad={ () => {
											setDisplayPlaceholder( false );
										} }
										onSelectMediaUploadOption={
											onSelectMedia
										}
										openMediaOptions={
											openMediaOptionsRef.current
										}
										url={ url }
										height="100%"
										style={ imagePreviewStyles }
										width={ styles.image.width }
									>
										{ focalPointHint }
									</Image>
								) }
								{ VIDEO_BACKGROUND_TYPE === backgroundType && (
									<>
										<Video
											muted
											paused
											disableFocus
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
											} }
											resizeMode={ 'cover' }
											source={ { uri: url } }
											style={ videoPreviewStyles }
										/>
										{ focalPointHint }
									</>
								) }
							</View>
						</BottomSheet.Cell>
						<FocalPointSettings
							focalPoint={
								focalPoint || IMAGE_DEFAULT_FOCAL_POINT
							}
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
						<BottomSheet.Cell
							leftAlign
							label={ __( 'Clear Media' ) }
							labelStyle={ styles.clearMediaButton }
							onPress={ onClearMedia }
						/>
					</>
				) : (
					<BottomSheet.Cell
						label={ __( 'Add image or video' ) }
						labelStyle={ addMediaButtonStyle }
						leftAlign
						onPress={ openMediaOptionsRef.current }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}

export default Controls;
