/**
 * External dependencies
 */
import { Cropper } from 'react-advanced-cropper';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getQueryArgs, getFilename } from '@wordpress/url';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	Icon,
	Tooltip,
	Button,
} from '@wordpress/components';
import {
	page,
	rotateLeft,
	rotateRight,
	flipHorizontal,
	flipVertical,
	lineSolid,
	plus,
} from '@wordpress/icons';
import { uploadMedia } from '@wordpress/media-utils';
import { store as noticesStore } from '@wordpress/notices';
import { useRef, useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Page from '../page';
import { getMediaTypeFromMimeType } from '../page-media/get-media';

import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function MediaEditor( { record } ) {
	const { receiveEntityRecords } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const cropperRef = useRef( null );
	const [ image, setImage ] = useState( record );
	const [ isEditingImage, setIsEditingImage ] = useState( false );
	const history = useHistory();
	const { params: urlParams } = useLocation();

	if ( ! isEditingImage ) {
		return (
			<>
				<Button
					variant="secondary"
					onClick={ () => setIsEditingImage( true ) }
				>
					{ __( 'Edit Image' ) }
				</Button>
				<img
					src={ image?.source_url || image?.url }
					alt={ image?.alt_text || image?.alt }
				/>
			</>
		);
	}

	const flip = ( horizontal, vertical ) => {
		if ( cropperRef.current ) {
			cropperRef.current.flipImage( horizontal, vertical, {
				transitions: true,
			} );
		}
	};

	const rotate = ( angle ) => {
		if ( cropperRef.current ) {
			cropperRef.current.rotateImage( angle, {
				transitions: true,
			} );
		}
	};

	const zoom = ( value ) => {
		if ( cropperRef.current ) {
			cropperRef.current.zoomImage( value, {
				transitions: true,
			} );
		}
	};

	const reset = () => {
		if ( cropperRef.current ) {
			cropperRef.current.reset();
		}
	};

	const uploadFiles = async ( files ) => {
		await uploadMedia( {
			filesList: files,
			onFileChange: ( newFiles ) => {
				const newMediaItems = newFiles.filter( ( file ) => !! file.id );
				if ( newMediaItems.length ) {
					receiveEntityRecords(
						'root',
						'media',
						newMediaItems,
						undefined,
						true
					);
					setImage( newMediaItems[ 0 ] );
					const updatedParams = {
						...urlParams,
						postId: newMediaItems[ 0 ].id,
					};
					history.push( updatedParams );
				}
				setIsEditingImage( false );
			},
			onError: ( error ) => {
				createErrorNotice( error.message, { type: 'snackbar' } );
			},
		} );
	};

	return (
		<>
			<HStack alignment="center" spacing={ 1 }>
				<Button
					icon={ rotateLeft }
					variant="secondary"
					label={ __( 'Rotate left' ) }
					onClick={ () => rotate( -90 ) }
				/>
				<Button
					icon={ rotateRight }
					variant="secondary"
					label={ __( 'Rotate right' ) }
					onClick={ () => rotate( 90 ) }
				/>
				<Button
					icon={ flipVertical }
					variant="secondary"
					label={ __( 'Flip vertical' ) }
					onClick={ () => flip( false, true ) }
				/>
				<Button
					icon={ flipHorizontal }
					variant="secondary"
					label={ __( 'Flip horizontal' ) }
					onClick={ () => flip( true, false ) }
				/>
				<Button
					icon={ lineSolid }
					variant="secondary"
					label={ __( 'Zoom out' ) }
					onClick={ () => zoom( 0.25 ) }
				/>
				<Button
					icon={ plus }
					variant="secondary"
					label={ __( 'Zoom in' ) }
					onClick={ () => zoom( 2 ) }
				/>
				<Button
					variant="primary"
					onClick={ () => {
						cropperRef.current.getCanvas()?.toBlob( ( blob ) => {
							const file = new window.File(
								[ blob ],
								getFilename( image?.source_url || image?.url ),
								{ type: image.mime_type }
							);
							uploadFiles( [ file ] );
						}, image.mime_type );
					} }
				>
					{ __( 'Save' ) }
				</Button>
				<Button variant="secondary" onClick={ () => reset() }>
					{ __( 'Reset' ) }
				</Button>
			</HStack>
			<Cropper
				ref={ cropperRef }
				rotateImage={ true }
				stencilProps={ {
					grid: true,
				} }
				src={ image?.source_url || image?.url }
			/>
		</>
	);
}

function MediaPreview( { mediaType, record } ) {
	if ( mediaType === 'application' ) {
		return (
			<Tooltip
				text={ `${ record?.title.raw } - ${
					record?.media_details?.filesize / 1000
				} kb` }
			>
				<a href={ record?.source_url } target="_blank" rel="noreferrer">
					<Icon icon={ page } size={ 128 } />
				</a>
			</Tooltip>
		);
	}

	if ( mediaType === 'image' ) {
		return <MediaEditor record={ record } />;
	}

	if ( mediaType === 'audio' ) {
		return (
			<audio
				controls="controls"
				src={ record?.source_url }
				autoPlay={ false }
				preload="true"
			/>
		);
	}

	if ( mediaType === 'video' ) {
		return (
			<video
				controls="controls"
				poster={ record?.poster }
				preload="true"
				src={ record?.source_url }
			/>
		);
	}
}
export default function PageMediaItem() {
	const { postId } = getQueryArgs( window.location.href );
	const { record } = useSelect(
		( select ) => {
			const { getMedia } = select( coreStore );
			return {
				record: getMedia( postId ),
			};
		},
		[ postId ]
	);

	const mediaType = record?.mime_type
		? getMediaTypeFromMimeType( record.mime_type )
		: undefined;

	return (
		<Page title={ __( 'Media item name here' ) } hideTitleFromUI>
			<Spacer
				padding={ 3 }
				className="edit-site-media-page-media-item__spacer"
			>
				<VStack
					spacing={ 3 }
					className="edit-site-media-page-media-item"
				>
					{ mediaType && record && (
						<MediaPreview
							mediaType={ mediaType }
							record={ record }
						/>
					) }
				</VStack>
			</Spacer>
		</Page>
	);
}
