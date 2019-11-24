/**
 * WordPress dependencies
 */
import {
	FocalPointPicker,
	IconButton,
	PanelBody,
	PanelRow,
	RangeControl,
	ToggleControl,
	Toolbar,
	Button,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
} from './shared';
import HeightInput from './height-input';

import BlockControls from '../block-controls';
import InspectorControls from '../inspector-controls';
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import PanelColorSettings from '../panel-color-settings';
import __experimentalGradientPickerControl from '../gradient-picker/control';

const BackgroundToolbarControls = ( {
	hasBackground,
	onSelectMedia,
	mediaId,
	allowedMediaTypes,
} ) => (
	<BlockControls>
		{ hasBackground && (
		<>
			<MediaUploadCheck>
				<Toolbar>
					<MediaUpload
						onSelect={ onSelectMedia }
						allowedTypes={ allowedMediaTypes }
						value={ mediaId }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit media' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
				</Toolbar>
			</MediaUploadCheck>
		</>
		) }
	</BlockControls>
);

const BackgroundInspectorControls = ( {
	mediaUrl,
	backgroundType,
	hasParallax,
	focalPoint,
	setAttributes,
	hasBackground,
	overlayColor,
	setOverlayColor,
	gradientValue,
	setGradient,
	dimRatio,
	temporaryMinHeight,
	minHeight,
} ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Dimensions' ) }>
			<HeightInput
				value={ temporaryMinHeight || minHeight }
				onChange={ ( newMinHeight ) => setAttributes( { minHeight: newMinHeight } ) }
			/>
		</PanelBody>
		{ !! mediaUrl && (
			<PanelBody title={ __( 'Media Settings' ) }>
				{ IMAGE_BACKGROUND_TYPE === backgroundType && (
					<ToggleControl
						label={ __( 'Fixed Background' ) }
						checked={ hasParallax }
						onChange={ () => {
							setAttributes( {
								hasParallax: ! hasParallax,
								...( ! hasParallax ? { focalPoint: undefined } : {} ),
							} );
						} }
					/>
				) }
				{ IMAGE_BACKGROUND_TYPE === backgroundType && ! hasParallax && (
					<FocalPointPicker
						label={ __( 'Focal Point Picker' ) }
						url={ mediaUrl }
						value={ focalPoint }
						onChange={ ( newFocalPoint ) => setAttributes( { focalPoint: newFocalPoint } ) }
					/>
				) }
				{ VIDEO_BACKGROUND_TYPE === backgroundType && (
					<video
						autoPlay
						muted
						loop
						src={ mediaUrl }
					/>
				) }
				<PanelRow>
					<Button
						isDefault
						isSmall
						className="block-library-cover__reset-button"
						onClick={ () => setAttributes( {
							url: undefined,
							id: undefined,
							backgroundType: undefined,
							dimRatio: undefined,
							focalPoint: undefined,
							hasParallax: undefined,
						} ) }
					>
						{ __( 'Clear Media' ) }
					</Button>
				</PanelRow>
			</PanelBody>
		) }
		{ hasBackground && (
		<>
			<PanelColorSettings
				title={ __( 'Overlay' ) }
				initialOpen={ true }
				colorSettings={ [ {
					value: overlayColor,
					onChange: ( ...args ) => {
						setAttributes( {
							customGradient: undefined,
						} );
						setOverlayColor( ...args );
					},
					label: __( 'Overlay Color' ),
				} ] }
			>
				<__experimentalGradientPickerControl
					label={ __( 'Overlay Gradient' ) }
					onChange={
						( newGradient ) => {
							setGradient( newGradient );
							setAttributes( {
								overlayColor: undefined,
							} );
						}
					}
					value={ gradientValue }
				/>
				{ !! mediaUrl && (
					<RangeControl
						label={ __( 'Background Opacity' ) }
						value={ dimRatio }
						onChange={ ( newDimRation ) => setAttributes( { dimRatio: newDimRation } ) }
						min={ 0 }
						max={ 100 }
						step={ 10 }
						required
					/>
				) }
			</PanelColorSettings>
		</>
		) }
	</InspectorControls>
);

export default function BackgroundControls( {
	attributes,
	setAttributes,
	hasBackground,
	overlayColor,
	setOverlayColor,
	gradientValue,
	setGradient,
	onSelectMedia,
	allowedMediaTypes,
	temporaryMinHeight,
	showInspectorControls = true,
	showToolbarControls = true,
} ) {
	const {
		backgroundType,
		dimRatio,
		focalPoint,
		hasParallax,
		minHeight,
		id,
		url,
	} = attributes;

	return (
		<>
			{ showInspectorControls && <BackgroundInspectorControls
				mediaUrl={ url }
				backgroundType={ backgroundType }
				hasParallax={ hasParallax }
				focalPoint={ focalPoint }
				setAttributes={ setAttributes }
				hasBackground={ hasBackground }
				overlayColor={ overlayColor }
				setOverlayColor={ setOverlayColor }
				gradientValue={ gradientValue }
				setGradient={ setGradient }
				dimRatio={ dimRatio }
				temporaryMinHeight={ temporaryMinHeight }
				minHeight={ minHeight }
			/> }
			{ showToolbarControls && <BackgroundToolbarControls
				hasBackground={ hasBackground }
				onSelectMedia={ onSelectMedia }
				mediaId={ id }
				allowedMediaTypes={ allowedMediaTypes }
			/> }
		</>
	);
}
