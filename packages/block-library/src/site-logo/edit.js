/**
 * External dependencies
 */
import classnames from 'classnames';
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import {
	IconButton,
	Notice,
	PanelBody,
	RangeControl,
	Toolbar,
	ResizableBox,
} from '@wordpress/components';
import {
	BlockControls,
	BlockAlignmentToolbar,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import icon from './icon';

import ImageSize from '../image/image-size';

const getHandleStates = ( align, isRTL = false ) => {
	const defaultAlign = isRTL ? 'right' : 'left';
	const handleStates = {
		left: {
			right: true,
			left: false,
		},
		center: {
			right: true,
			left: true,
		},
		right: {
			right: false,
			left: true,
		},
	};

	return handleStates[ align ? align : defaultAlign ];
};

export default function LogoEdit( { attributes: { align, width }, children, className, clientId, setAttributes, isSelected } ) {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ url, setUrl ] = useState( null );
	const [ error, setError ] = useState();
	const [ logo, setLogo ] = useEntityProp( 'root', 'site', 'sitelogo' );
	const [ isDirty, , save ] = __experimentalUseEntitySaving(
		'root',
		'site',
		'sitelogo'
	);

	const mediaItemData = useSelect(
		( select ) => {
			const mediaItem = select( 'core' ).getEntityRecord( 'root', 'media', logo );
			return mediaItem && {
				url: mediaItem.source_url,
				alt: mediaItem.alt_text,
			};
		}, [ logo ] );

	const { isRTL, isLargeViewport } = useSelect(
		( select ) => ( {
			isRTL: select( 'core/block-editor' ).getSettings().isRTL,
			isLargeViewport: select( 'core/viewport' ).isViewportMatch( 'medium' ),
		} )
	);

	let alt = null;
	if ( mediaItemData ) {
		alt = mediaItemData.alt;
		if ( url !== mediaItemData.url ) {
			setUrl( mediaItemData.url );
		}
	}

	if ( isDirty ) {
		save();
	}

	const toggleIsEditing = () => setIsEditing( ! isEditing );

	const setIsNotEditing = () => setIsEditing( false );

	const onSelectLogo = ( media ) => {
		if ( ! media ) {
			return;
		}

		if ( ! media.id && media.url ) { // This is a temporary blob image
			setLogo( '' );
			setUrl( media.url );
			setIsNotEditing();
			return;
		}

		setLogo( media.id.toString() );
		setIsNotEditing();
	};

	const deleteLogo = () => {
		setLogo( '' );
	};

	const controls = (
		<BlockControls>
			<BlockAlignmentToolbar
				value={ align }
				onChange={ ( newAlign ) => setAttributes( { align: newAlign } ) }
				controls={ [ 'left', 'center', 'right' ] }
			/>
			{ !! url && (
				<Toolbar>
					<IconButton
						className={ classnames( 'components-icon-button components-toolbar__control', { 'is-active': isEditing } ) }
						label={ __( 'Edit image' ) }
						aria-pressed={ isEditing }
						onClick={ toggleIsEditing }
						icon="edit"
					/>
				</Toolbar>
			) }
		</BlockControls>
	);

	const getInspectorControls = ( imageWidth, resizedImageWidth, containerWidth, canResize ) => {
		return (
			<InspectorControls>
				<PanelBody title={ __( 'Site Logo Settings' ) }>
					<RangeControl
						label={ __( 'Image width' ) }
						onChange={ ( newWidth ) => setAttributes( { width: newWidth } ) }
						min={ 10 }
						max={ Math.min( imageWidth, containerWidth ) }
						initialPosition={ Math.min( imageWidth, containerWidth ) }
						value={ resizedImageWidth || '' }
						disabled={ ! canResize }
					/>
				</PanelBody>
			</InspectorControls>
		);
	};

	const [ maxWidth, setMaxWidth ] = useState( 10 );

	useEffect( () => {
		const wrapperElement = document.getElementById( `block-${ clientId }` );
		const calculateMaxWidth = debounce( () => setMaxWidth( wrapperElement && wrapperElement.clientWidth ), 250 );
		calculateMaxWidth();
		window.addEventListener( 'resize', calculateMaxWidth );
		return () => window.removeEventListener( 'resize', calculateMaxWidth );
	} );

	const classes = classnames( 'custom-logo-link', {
		'is-transient': isBlobURL( url ),
	} );

	const img = (
		<a href="#home" className={ classes } rel="home">
			<img className="custom-logo" src={ url } alt={ alt } />
		</a>
	);

	const label = __( 'Site Logo' );
	const logoImage = (
		<ImageSize src={ url }>
			{ ( sizes ) => {
				const {
					imageWidthWithinContainer,
					imageWidth,
					imageHeight,
				} = sizes;

				const currentWidth = width || imageWidthWithinContainer;
				const ratio = imageWidth / imageHeight;
				const currentHeight = currentWidth / ratio;

				const maxWidthProp = {};
				if ( maxWidth ) {
					maxWidthProp.maxWidth = Math.min( imageWidth, maxWidth );
				}

				const canResize = ! isEditing && isLargeViewport && ( ! width || width <= maxWidth );

				const wrapperProps = {};
				if ( align ) {
					wrapperProps.className = `align${ align }`;
				}

				if ( ! canResize ) {
					wrapperProps.style = { width: Math.min( currentWidth, maxWidth ) };
				}

				const boxSize = {
					width: Math.min( currentWidth, maxWidth ),
					height: ( maxWidth && currentWidth <= maxWidth ) ? currentHeight : maxWidth / ratio,
				};

				return (
					<>
						{ getInspectorControls( imageWidth, width, maxWidth, canResize ) }
						<div { ...wrapperProps }>
							{ canResize ? (
								<ResizableBox
									showHandle={ isSelected }
									size={ boxSize }
									lockAspectRatio={ true }
									minWidth={ 10 }
									{ ...maxWidthProp }
									enable={ {
										top: false,
										bottom: true,
										...getHandleStates( align, isRTL ),
									} }

									onResizeStop={ ( event, direction, elt, delta ) => {
										setAttributes( {
											width: parseInt( currentWidth + delta.width, 10 ),
										} );
									} }
									style={ { display: 'inline-block' } }
								>
									{ img }
								</ResizableBox>
							) : img }
						</div>
					</>
				);
			} }
		</ImageSize>
	);
	const editComponent = (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ icon } /> }
			labels={ {
				title: label,
				instructions: __( 'Upload an image, or pick one from your media library, to be your site logo' ),
			} }
			onSelect={ onSelectLogo }
			accept="image/*"
			allowedTypes={ [ 'image' ] }
			mediaPreview={ !! url && img }
			notices={ error && (
				<Notice status="error" isDismissable={ false }>{ error }</Notice>
			) }
			onCancel={ !! url && setIsNotEditing }
			onError={ ( message ) => setError( message[ 2 ] ? message[ 2 ] : null ) }
		>
			{ !! url && (
				<IconButton isLarge icon="delete" onClick={ deleteLogo }>
					{ __( 'Delete Site Logo' ) }
				</IconButton>
			) }
			{ children }
		</MediaPlaceholder>
	);

	return (
		<div className={ className }>
			{ controls }
			{ ! url || isEditing ? editComponent : logoImage }
		</div>
	);
}
