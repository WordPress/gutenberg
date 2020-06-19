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
	const [ aspect, setAspect ] = useState( naturalWidth / naturalHeight );
	const [ rotation, setRotation ] = useState( 0 );
	const [ editedUrl, setEditedUrl ] = useState();

	const editedWidth = width;
	let editedHeight = height || ( clientWidth * naturalHeight ) / naturalWidth;

	if ( rotation % 180 === 90 ) {
		editedHeight = ( clientWidth * naturalWidth ) / naturalHeight;
	}

	function apply() {
		setIsProgress( true );

		const attrs = { crop };

		if ( rotation > 0 ) {
			attrs.rotation = rotation;
		}

		richImageRequest( id, attrs )
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
		const angle = ( rotation + 90 ) % 360;

		if ( angle === 0 ) {
			setEditedUrl();
			setRotation( angle );
			setAspect( 1 / aspect );
			return;
		}

		function editImage( event ) {
			const canvas = document.createElement( 'canvas' );

			let translateX = 0;
			let translateY = 0;

			if ( angle % 180 ) {
				canvas.width = event.target.height;
				canvas.height = event.target.width;
			} else {
				canvas.width = event.target.width;
				canvas.height = event.target.height;
			}

			if ( angle === 90 || angle === 180 ) {
				translateX = canvas.width;
			}

			if ( angle === 270 || angle === 180 ) {
				translateY = canvas.height;
			}

			const context = canvas.getContext( '2d' );

			context.translate( translateX, translateY );
			context.rotate( ( angle * Math.PI ) / 180 );
			context.drawImage( event.target, 0, 0 );

			canvas.toBlob( ( blob ) => {
				setEditedUrl( URL.createObjectURL( blob ) );
				setRotation( angle );
				setAspect( 1 / aspect );
			} );
		}

		const el = new window.Image();
		el.src = url;
		el.onload = editImage;
	}

	return (
		<>
			<div
				className={ classnames( 'richimage__crop-area', {
					'is-applying': inProgress,
				} ) }
				style={ {
					width: editedWidth,
					height: editedHeight,
				} }
			>
				<Cropper
					image={ editedUrl || url }
					disabled={ inProgress }
					minZoom={ MIN_ZOOM }
					maxZoom={ MAX_ZOOM }
					crop={ position }
					zoom={ zoom }
					aspect={ aspect }
					onCropChange={ setPosition }
					onCropComplete={ setCrop }
					onZoomChange={ setZoom }
					onRotationChange={ setRotation }
				/>
				{ inProgress && <Spinner /> }
			</div>
			{ ! inProgress && (
				<RangeControl
					className="richimage__zoom-control"
					label={ __( 'Zoom' ) }
					min={ MIN_ZOOM }
					max={ MAX_ZOOM }
					step={ ZOOM_STEP }
					value={ zoom }
					onChange={ setZoom }
				/>
			) }
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ rotateRightIcon }
						label={ __( 'Rotate' ) }
						onClick={ rotate }
						disabled={ inProgress }
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
					<ToolbarButton onClick={ apply } disabled={ inProgress }>
						{ __( 'Apply' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
		</>
	);
}
