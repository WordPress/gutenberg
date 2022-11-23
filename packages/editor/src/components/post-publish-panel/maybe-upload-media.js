/**
 * WordPress dependencies
 */
import { PanelBody, Button, Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );
		result.push( ...flattenBlocks( block.innerBlocks ) );
	} );

	return result;
}

function Image( block ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	return (
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
		<img
			onClick={ () => {
				selectBlock( block.clientId );
			} }
			key={ block.clientId }
			alt={ block.attributes.alt }
			src={ block.attributes.url }
			style={ {
				width: '36px',
				height: '36px',
				objectFit: 'cover',
				borderRadius: '2px',
				cursor: 'pointer',
			} }
		/>
	);
}

export default function PostFormatPanel() {
	const [ blobUrls, setBlobUrls ] = useState( [] );
	const [ isUploading, setIsUploading ] = useState( false );
	const externalImages = useSelect( ( select ) => {
		const { getEditorBlocks } = select( editorStore );
		return flattenBlocks( getEditorBlocks() ).filter( ( block ) => {
			return (
				block.name === 'core/image' &&
				block.attributes.url &&
				! block.attributes.id
			);
		} );
	}, [] );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const mediaUpload = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );

		return getSettings().mediaUpload;
	}, [] );
	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'External media' ) }
		</span>,
	];

	useEffect( () => {
		externalImages.forEach( ( image ) => {
			if ( ! blobUrls[ image.attributes.url ] ) {
				window
					.fetch( image.attributes.url )
					.then( ( response ) => response.blob() )
					.then( ( blob ) =>
						setBlobUrls( ( blobs ) => [
							...blobs,
							{ clientId: image.clientId, blob },
						] )
					)
					// Do nothing, cannot upload.
					.catch( () => {} );
			}
		} );
	}, [ externalImages ] );

	const nonUploadableImages = externalImages.filter(
		( image ) =>
			! blobUrls.find( ( { clientId } ) => image.clientId === clientId )
	);

	function uploadImages() {
		setIsUploading( true );
		Promise.all(
			blobUrls.map( ( { clientId, blob } ) => {
				return new Promise( ( resolve, reject ) => {
					mediaUpload( {
						filesList: [ blob ],
						onFileChange: ( [ media ] ) => {
							if ( isBlobURL( media.url ) ) {
								return;
							}

							setBlobUrls( ( blobs ) =>
								blobs.filter(
									( { clientId: id } ) => id !== clientId
								)
							);
							updateBlockAttributes( clientId, {
								id: media.id,
								url: media.url,
							} );
							resolve();
						},
						onError() {
							reject();
						},
					} );
				} );
			} )
		).then( () => {
			setIsUploading( false );
		} );
	}

	return (
		<PanelBody initialOpen={ true } title={ panelBodyTitle }>
			<p>
				{ __(
					'There are some external images in the post. You can upload them to the media library.'
				) }
			</p>
			<div
				style={ {
					display: 'inline-flex',
					'flex-wrap': 'wrap',
					gap: '8px',
				} }
			>
				{ blobUrls.map( ( { clientId: _clientId } ) => {
					const image = externalImages.find(
						( { clientId } ) => clientId === _clientId
					);
					return <Image key={ _clientId } { ...image } />;
				} ) }
				<Button
					icon={ upload }
					variant="secondary"
					onClick={ uploadImages }
				>
					{ __( 'Upload all' ) }
				</Button>
			</div>

			{ isUploading && <Spinner /> }
			<p>
				{ __( 'The following images can only be uploaded manually.' ) }
			</p>
			<div
				style={ {
					display: 'inline-flex',
					'flex-wrap': 'wrap',
					gap: '8px',
				} }
			>
				{ nonUploadableImages.map( ( image ) => (
					<Image key={ image.clientId } { ...image } />
				) ) }
			</div>
		</PanelBody>
	);
}
