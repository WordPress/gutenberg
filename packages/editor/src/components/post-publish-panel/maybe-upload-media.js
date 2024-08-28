/**
 * WordPress dependencies
 */
import {
	PanelBody,
	Button,
	Spinner,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';

function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );
		result.push( ...flattenBlocks( block.innerBlocks ) );
	} );

	return result;
}

function hasExternalMedia( block ) {
	if ( block.name === 'core/image' || block.name === 'core/cover' ) {
		return block.attributes.url && ! block.attributes.id;
	}

	if ( block.name === 'core/media-text' ) {
		return block.attributes.mediaUrl && ! block.attributes.mediaId;
	}
}

function getMediaInfo( block ) {
	if ( block.name === 'core/image' || block.name === 'core/cover' ) {
		const { url, alt, id } = block.attributes;
		return { url, alt, id };
	}

	if ( block.name === 'core/media-text' ) {
		const { mediaUrl: url, mediaAlt: alt, mediaId: id } = block.attributes;
		return { url, alt, id };
	}
}

function Image( { clientId, alt, url } ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	return (
		<motion.img
			tabIndex={ 0 }
			role="button"
			aria-label={ __( 'Select image block.' ) }
			onClick={ () => {
				selectBlock( clientId );
			} }
			onKeyDown={ ( event ) => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					selectBlock( clientId );
					event.preventDefault();
				}
			} }
			key={ clientId }
			alt={ alt }
			src={ url }
			animate={ { opacity: 1 } }
			exit={ { opacity: 0, scale: 0 } }
			style={ {
				width: '36px',
				height: '36px',
				objectFit: 'cover',
				borderRadius: '2px',
				cursor: 'pointer',
			} }
			whileHover={ { scale: 1.08 } }
		/>
	);
}

export default function PostFormatPanel() {
	const [ isUploading, setIsUploading ] = useState( false );
	const [ isAnimating, setIsAnimating ] = useState( false );
	const [ hadUploadError, setHadUploadError ] = useState( false );
	const { editorBlocks, mediaUpload } = useSelect(
		( select ) => ( {
			editorBlocks: select( blockEditorStore ).getBlocks(),
			mediaUpload: select( blockEditorStore ).getSettings().mediaUpload,
		} ),
		[]
	);
	const blocksWithExternalMedia = flattenBlocks( editorBlocks ).filter(
		( block ) => hasExternalMedia( block )
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	if ( ! mediaUpload || ! blocksWithExternalMedia.length ) {
		return null;
	}

	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'External media' ) }
		</span>,
	];

	function updateBlockWithUploadedMedia( block, media ) {
		if ( block.name === 'core/image' || block.name === 'core/cover' ) {
			return updateBlockAttributes( block.clientId, {
				id: media.id,
				url: media.url,
			} );
		}

		if ( block.name === 'core/media-text' ) {
			return updateBlockAttributes( block.clientId, {
				mediaId: media.id,
				mediaUrl: media.url,
			} );
		}
	}

	function uploadImages() {
		setIsUploading( true );
		setHadUploadError( false );
		Promise.all(
			blocksWithExternalMedia.map( ( block ) => {
				const { url } = getMediaInfo( block );
				return window
					.fetch( url.includes( '?' ) ? url : url + '?' )
					.then( ( response ) => response.blob() )
					.then( ( blob ) =>
						new Promise( ( resolve, reject ) => {
							mediaUpload( {
								filesList: [ blob ],
								onFileChange: ( [ media ] ) => {
									if ( isBlobURL( media.url ) ) {
										return;
									}

									updateBlockWithUploadedMedia(
										block,
										media
									);
									resolve();
								},
								onError() {
									setHadUploadError( true );
									reject();
								},
							} );
						} ).then( () => setIsAnimating( true ) )
					)
					.catch( () => {
						setHadUploadError( true );
					} );
			} )
		).finally( () => {
			setIsUploading( false );
		} );
	}

	return (
		<PanelBody initialOpen title={ panelBodyTitle }>
			<p>
				{ __(
					'Upload external images to the Media Library. Images from different domains may load slowly, display incorrectly, or be removed unexpectedly.'
				) }
			</p>
			<div
				style={ {
					display: 'inline-flex',
					flexWrap: 'wrap',
					gap: '8px',
				} }
			>
				<AnimatePresence
					onExitComplete={ () => setIsAnimating( false ) }
				>
					{ blocksWithExternalMedia.map( ( block ) => {
						const { url, alt } = getMediaInfo( block );
						return (
							<Image
								key={ block.clientId }
								clientId={ block.clientId }
								url={ url }
								alt={ alt }
							/>
						);
					} ) }
				</AnimatePresence>
				{ isUploading || isAnimating ? (
					<Spinner />
				) : (
					<Button
						// TODO: Switch to `true` (40px size) if possible
						__next40pxDefaultSize={ false }
						variant="primary"
						onClick={ uploadImages }
					>
						{ __( 'Upload' ) }
					</Button>
				) }
			</div>
			{ hadUploadError && <p>{ __( 'Upload failed, try again.' ) }</p> }
		</PanelBody>
	);
}
