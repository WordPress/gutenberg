/**
 * External dependencies
 */

import Cropper from 'react-easy-crop';

/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import {
	rotateRight as rotateRightIcon,
	aspectRatio as aspectRatioIcon,
} from '@wordpress/icons';
import {
	ToolbarGroup,
	ToolbarButton,
	__experimentalToolbarItem as ToolbarItem,
	Spinner,
	RangeControl,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const POPOVER_PROPS = { position: 'bottom right' };

function richImageRequest( id, attrs ) {
	return apiFetch( {
		path: `__experimental/richimage/${ id }/apply`,
		headers: {
			'Content-type': 'application/json',
		},
		method: 'POST',
		body: JSON.stringify( attrs ),
	} );
}

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

function AspectMenu( { isDisabled, onClick, toggleProps } ) {
	return (
		<DropdownMenu
			icon={ aspectRatioIcon }
			label={ __( 'Aspect Ratio' ) }
			popoverProps={ POPOVER_PROPS }
			toggleProps={ toggleProps }
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
	const [ zoom, setZoom ] = useState( 1 );
	const [ aspect, setAspect ] = useState( 4 / 3 );
	const [ rotation, setRotation ] = useState( 0 );

	function apply() {
		setIsProgress( true );

		richImageRequest( id, { crop, rotation } )
			.then( ( response ) => {
				setIsProgress( false );
				setIsEditingImage( false );

				if ( response.media_id && response.media_id !== id ) {
					setAttributes( {
						id: response.media_id,
						url: response.url,
					} );
				}
			} )
			.catch( () => {
				createErrorNotice(
					__(
						'Unable to perform the image modification. Please check your media storage.'
					),
					{
						id: 'image-editing-error',
						type: 'snackbar',
					}
				);
				setIsProgress( false );
				setIsEditingImage( false );
			} );
	}

	function rotate() {
		setRotation( ( value ) => ( value + 90 ) % 360 );
	}

	return (
		<>
			{ inProgress && (
				<div className="richimage__working-spinner">
					<Spinner />
				</div>
			) }
			<div
				className="richimage__crop-area"
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
					minZoom={ MIN_ZOOM }
					maxZoom={ MAX_ZOOM }
					crop={ position }
					zoom={ zoom }
					rotation={ rotation }
					aspect={ aspect }
					onCropChange={ setPosition }
					onCropComplete={ setCrop }
					onZoomChange={ setZoom }
					onRotationChange={ setRotation }
				/>
			</div>
			<RangeControl
				className="richimage__zoom-control"
				label={ __( 'Zoom' ) }
				min={ MIN_ZOOM }
				max={ MAX_ZOOM }
				step={ ZOOM_STEP }
				value={ zoom }
				onChange={ setZoom }
			/>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ rotateRightIcon }
						label={ __( 'Rotate' ) }
						onClick={ rotate }
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarItem>
						{ ( toggleProps ) => (
							<AspectMenu
								toggleProps={ toggleProps }
								isDisabled={ inProgress }
								onClick={ setAspect }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton onClick={ apply }>
						{ __( 'Apply' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
		</>
	);
}
