/**
 * External dependencies
 */

import Cropper from 'react-easy-crop';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import {
	Icon,
	search,
	rotateRight as rotateRightIcon,
	aspectRatio as aspectRatioIcon,
} from '@wordpress/icons';
import {
	ToolbarGroup,
	ToolbarButton,
	Spinner,
	RangeControl,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */

import { convertCropCoordinateSystem } from './utils';

const MIN_ZOOM = 100;
const MAX_ZOOM = 300;
const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

function AspectGroup( { aspectRatios, isDisabled, label, onClick } ) {
	return (
		<MenuGroup label={ label }>
			{ aspectRatios.map( ( { title, aspect } ) => (
				<MenuItem
					key={ aspect }
					isDisabled={ isDisabled }
					onClick={ () => {
						onClick( aspect );
					} }
				>
					{ title }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

function AspectMenu( { isDisabled, onClick } ) {
	return (
		<DropdownMenu
			icon={ aspectRatioIcon }
			label={ __( 'Aspect Ratio' ) }
			popoverProps={ POPOVER_PROPS }
			className="wp-block-image__aspect-ratio"
		>
			{ ( { onClose } ) => (
				<>
					<AspectGroup
						label={ __( 'Landscape' ) }
						isDisabled={ isDisabled }
						onClick={ ( aspect ) => {
							onClick( aspect );
							onClose();
						} }
						aspectRatios={ [
							{
								title: __( '16:10' ),
								aspect: 16 / 10,
							},
							{
								title: __( '16:9' ),
								aspect: 16 / 9,
							},
							{
								title: __( '4:3' ),
								aspect: 4 / 3,
							},
							{
								title: __( '3:2' ),
								aspect: 3 / 2,
							},
						] }
					/>
					<AspectGroup
						label={ __( 'Portrait' ) }
						isDisabled={ isDisabled }
						onClick={ ( aspect ) => {
							onClick( aspect );
							onClose();
						} }
						aspectRatios={ [
							{
								title: __( '10:16' ),
								aspect: 10 / 16,
							},
							{
								title: __( '9:16' ),
								aspect: 9 / 16,
							},
							{
								title: __( '3:4' ),
								aspect: 3 / 4,
							},
							{
								title: __( '2:3' ),
								aspect: 2 / 3,
							},
						] }
					/>
					<AspectGroup
						isDisabled={ isDisabled }
						onClick={ ( aspect ) => {
							onClick( aspect );
							onClose();
						} }
						aspectRatios={ [
							{
								title: __( 'Square' ),
								aspect: 1,
							},
						] }
					/>
				</>
			) }
		</DropdownMenu>
	);
}

export default function ImageEditor( {
	id,
	url,
	setAttributes,
	naturalWidth,
	naturalHeight,
	width,
	height,
	clientWidth,
	setIsEditingImage,
} ) {
	const { createErrorNotice } = useDispatch( 'core/notices' );
	const [ inProgress, setIsProgress ] = useState( false );
	const [ crop, setCrop ] = useState( null );
	const [ position, setPosition ] = useState( { x: 0, y: 0 } );
	const [ zoom, setZoom ] = useState( 100 );
	const [ aspect, setAspect ] = useState( naturalWidth / naturalHeight );
	const [ rotation, setRotation ] = useState( 0 );

	function apply() {
		setIsProgress( true );

		const size = {
			width: naturalWidth,
			height: naturalHeight,
		};

		const newCrop = convertCropCoordinateSystem( rotation, size, crop );

		let attrs = {};

		// The crop script may return some very small, sub-pixel values when the image was not cropped.
		// Crop only when the new size has changed by more than 0.1%.
		if ( newCrop.width < 99.9 || newCrop.height < 99.9 ) {
			attrs = newCrop;
		}

		if ( rotation > 0 ) {
			attrs.rotation = rotation;
		}

		apiFetch( {
			path: `wp/v2/media/${ id }/edit`,
			method: 'POST',
			data: attrs,
		} )
			.then( ( response ) => {
				setAttributes( {
					id: response.id,
					url: response.source_url,
				} );
			} )
			.catch( ( error ) => {
				createErrorNotice(
					sprintf(
						/* translators: 1. Error message */
						__( 'Could not edit image. %s' ),
						error.message
					),
					{
						id: 'image-editing-error',
						type: 'snackbar',
					}
				);
			} )
			.finally( () => {
				setIsProgress( false );
				setIsEditingImage( false );
			} );
	}

	return (
		<>
			{ ! inProgress && (
				<div
					className="wp-block-image__zoom-control"
					aria-label={ __( 'Zoom' ) }
				>
					<Icon icon={ search } />
					<RangeControl
						min={ MIN_ZOOM }
						max={ MAX_ZOOM }
						value={ Math.round( zoom ) }
						onChange={ setZoom }
					/>
					<AspectMenu
						isDisabled={ inProgress }
						onClick={ setAspect }
					/>
				</div>
			) }
			<div
				className={ classnames( 'wp-block-image__crop-area', {
					'is-applying': inProgress,
				} ) }
				style={ {
					width,
					height:
						height ||
						( clientWidth * naturalHeight ) / naturalWidth,
				} }
			>
				<Cropper
					image={ url }
					disabled={ inProgress }
					minZoom={ MIN_ZOOM / 100 }
					maxZoom={ MAX_ZOOM / 100 }
					crop={ position }
					zoom={ zoom / 100 }
					aspect={ aspect }
					rotation={ rotation }
					onCropChange={ setPosition }
					onCropComplete={ ( croppedArea ) => {
						setCrop( croppedArea );
					} }
					onZoomChange={ ( newZoom ) => {
						setZoom( newZoom * 100 );
					} }
				/>
				{ inProgress && <Spinner /> }
			</div>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ rotateRightIcon }
						label={ __( 'Rotate' ) }
						onClick={ () =>
							setRotation( ( prev ) => ( prev + 90 ) % 360 )
						}
						disabled={ inProgress }
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton onClick={ apply } disabled={ inProgress }>
						{ __( 'Apply' ) }
					</ToolbarButton>
					<ToolbarButton onClick={ () => setIsEditingImage( false ) }>
						{ __( 'Cancel' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
		</>
	);
}
