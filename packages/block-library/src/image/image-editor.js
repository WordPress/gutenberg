/**
 * External dependencies
 */

import classnames from 'classnames';
import Cropper from 'react-easy-crop';

/**
 * WordPress dependencies
 */

import { BlockControls } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import {
	rotateLeft as rotateLeftIcon,
	rotateRight as rotateRightIcon,
	flipHorizontal as flipHorizontalIcon,
	flipVertical as flipVerticalIcon,
	crop as cropIcon,
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

const ROTATE_STEP = 90;
const DEFAULT_CROP = {
	unit: '%',
	x: 25,
	y: 25,
	width: 50,
	height: 50,
};
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const POPOVER_PROPS = { position: 'bottom right' };

function richImageRequest( id, action, attrs ) {
	return apiFetch( {
		path: `__experimental/richimage/${ id }/${ action }`,
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
	isSelected,
	children,
} ) {
	const { createErrorNotice } = useDispatch( 'core/notices' );
	const [ isCropping, setIsCropping ] = useState( false );
	const [ inProgress, setInProgress ] = useState( null );
	const [ imageSize, setImageSize ] = useState( {
		naturalHeight: 0,
		naturalWidth: 0,
	} );
	const [ crop, setCrop ] = useState( null );
	const [ position, setPosition ] = useState( { x: 0, y: 0 } );
	const [ zoom, setZoom ] = useState( 1 );
	const [ aspect, setAspect ] = useState( 4 / 3 );

	// Cancel cropping on deselect.
	useEffect( () => {
		if ( ! isSelected ) {
			setIsCropping( false );
		}
	}, [ isSelected ] );

	function adjustImage( action, attrs ) {
		setInProgress( action );

		richImageRequest( id, action, attrs )
			.then( ( response ) => {
				setInProgress( null );
				setIsCropping( false );

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
				setInProgress( null );
				setIsCropping( false );
			} );
	}

	function cropImage() {
		adjustImage( 'crop', {
			crop_x: crop.x,
			crop_y: crop.y,
			crop_width: crop.width,
			crop_height: crop.height,
		} );
	}

	const classes = classnames( {
		richimage__working: inProgress !== null,
		[ 'richimage__working__' + inProgress ]: inProgress !== null,
	} );

	return (
		<>
			<div className={ classes }>
				{ inProgress && (
					<div className="richimage__working-spinner">
						<Spinner />
					</div>
				) }
				{ isCropping ? (
					<div className="richimage__crop-controls">
						<div
							className="richimage__crop-area"
							style={ {
								paddingBottom: `${
									( 100 * imageSize.naturalHeight ) /
									imageSize.naturalWidth
								}%`,
							} }
						>
							<Cropper
								image={ url }
								disabled={ inProgress }
								minZoom={ MIN_ZOOM }
								maxZoom={ MAX_ZOOM }
								crop={ position }
								zoom={ zoom }
								aspect={ aspect }
								onCropChange={ setPosition }
								onCropComplete={ setCrop }
								onZoomChange={ setZoom }
								onMediaLoaded={ setImageSize }
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
					</div>
				) : (
					children
				) }
			</div>
			<BlockControls>
				{ ! isCropping && (
					<ToolbarGroup>
						<ToolbarItem>
							{ ( toggleProps ) => (
								<DropdownMenu
									icon={ rotateLeftIcon }
									label={ __( 'Rotate' ) }
									popoverProps={ POPOVER_PROPS }
									toggleProps={ toggleProps }
									controls={ [
										{
											icon: rotateLeftIcon,
											title: __( 'Rotate left' ),
											isDisabled: inProgress,
											onClick() {
												adjustImage( 'rotate', {
													angle: -ROTATE_STEP,
												} );
											},
										},
										{
											icon: rotateRightIcon,
											title: __( 'Rotate right' ),
											isDisabled: inProgress,
											onClick() {
												adjustImage( 'rotate', {
													angle: ROTATE_STEP,
												} );
											},
										},
									] }
								/>
							) }
						</ToolbarItem>
						<ToolbarItem>
							{ ( toggleProps ) => (
								<DropdownMenu
									icon={ flipVerticalIcon }
									label={ __( 'Flip' ) }
									popoverProps={ POPOVER_PROPS }
									toggleProps={ toggleProps }
									controls={ [
										{
											icon: flipVerticalIcon,
											title: __( 'Flip vertical' ),
											isDisabled: inProgress,
											onClick: () => {
												adjustImage( 'flip', {
													direction: 'vertical',
												} );
											},
										},
										{
											icon: flipHorizontalIcon,
											title: __( 'Flip horizontal' ),
											isDisabled: inProgress,
											onClick: () => {
												adjustImage( 'flip', {
													direction: 'horizontal',
												} );
											},
										},
									] }
								/>
							) }
						</ToolbarItem>
						<ToolbarButton
							disabled={ inProgress }
							icon={ cropIcon }
							label={ __( 'Crop' ) }
							onClick={ () => {
								setIsCropping( ( prev ) => ! prev );
								setCrop( DEFAULT_CROP );
							} }
						/>
					</ToolbarGroup>
				) }
				{ isCropping && (
					<>
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
							<ToolbarButton onClick={ cropImage }>
								{ __( 'Apply' ) }
							</ToolbarButton>
							<ToolbarButton
								onClick={ () => {
									setIsCropping( false );
								} }
							>
								{ __( 'Cancel' ) }
							</ToolbarButton>
						</ToolbarGroup>
					</>
				) }
			</BlockControls>
		</>
	);
}
