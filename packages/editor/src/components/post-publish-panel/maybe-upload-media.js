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
import { __, _x } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { fetchMedia } from './media-util';

function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );
		result.push( ...flattenBlocks( block.innerBlocks ) );
	} );

	return result;
}

/**
 * Determine whether a block has external media.
 *
 * Different blocks use different attribute names (and potentially
 * different logic as well) in determining whether the media is
 * present, and whether it's external.
 *
 * @param {{name: string, attributes: Object}} block The block.
 * @return {boolean?} Whether the block has external media
 */
function hasExternalMedia( block ) {
	if ( block.name === 'core/image' || block.name === 'core/cover' ) {
		return block.attributes.url && ! block.attributes.id;
	}

	if ( block.name === 'core/media-text' ) {
		return block.attributes.mediaUrl && ! block.attributes.mediaId;
	}

	return undefined;
}

/**
 * Retrieve media info from a block.
 *
 * Different blocks use different attribute names, so we need this
 * function to normalize things into a consistent naming scheme.
 *
 * @param {{name: string, attributes: Object}} block The block.
 * @return {{url: ?string, alt: ?string, id: ?number}} The media info for the block.
 */
function getMediaInfo( block ) {
	if ( block.name === 'core/image' || block.name === 'core/cover' ) {
		const { url, alt, id } = block.attributes;
		return { url, alt, id };
	}

	if ( block.name === 'core/media-text' ) {
		const { mediaUrl: url, mediaAlt: alt, mediaId: id } = block.attributes;
		return { url, alt, id };
	}

	return {};
}

// Image component to represent a single image in the upload dialog.
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
				width: '32px',
				height: '32px',
				objectFit: 'cover',
				borderRadius: '2px',
				cursor: 'pointer',
			} }
			whileHover={ { scale: 1.08 } }
		/>
	);
}

export default function MaybeUploadMediaPanel() {
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

	// Get a list of blocks with external media.
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

	/**
	 * Update an individual block to point to newly-added library media.
	 *
	 * Different blocks use different attribute names, so we need this
	 * function to ensure we modify the correct attributes for each type.
	 *
	 * @param {{name: string, attributes: Object}} block The block.
	 * @param {{id: number, url: string}}          media Media library file info.
	 */
	function updateBlockWithUploadedMedia( block, media ) {
		if ( block.name === 'core/image' || block.name === 'core/cover' ) {
			updateBlockAttributes( block.clientId, {
				id: media.id,
				url: media.url,
			} );
		}

		if ( block.name === 'core/media-text' ) {
			updateBlockAttributes( block.clientId, {
				mediaId: media.id,
				mediaUrl: media.url,
			} );
		}
	}

	// Handle fetching and uploading all external media in the post.
	function uploadImages() {
		setIsUploading( true );
		setHadUploadError( false );

		// Multiple blocks can be using the same URL, so we
		// should ensure we only fetch and upload each of them once.
		const mediaUrls = new Set(
			blocksWithExternalMedia.map( ( block ) => {
				const { url } = getMediaInfo( block );
				return url;
			} )
		);

		// Create an upload promise for each URL, that we can wait for in all
		// blocks that make use of that media.
		const uploadPromises = Object.fromEntries(
			Object.entries( fetchMedia( [ ...mediaUrls ] ) ).map(
				( [ url, filePromise ] ) => {
					const uploadPromise = filePromise.then(
						( blob ) =>
							new Promise( ( resolve, reject ) => {
								mediaUpload( {
									filesList: [ blob ],
									onFileChange: ( [ media ] ) => {
										if ( isBlobURL( media.url ) ) {
											return;
										}

										resolve( media );
									},
									onError() {
										reject();
									},
								} );
							} )
					);

					return [ url, uploadPromise ];
				}
			)
		);

		// Wait for all blocks to be updated with library media.
		Promise.allSettled(
			blocksWithExternalMedia.map( ( block ) => {
				const { url } = getMediaInfo( block );

				return uploadPromises[ url ]
					.then( ( media ) =>
						updateBlockWithUploadedMedia( block, media )
					)
					.then( () => setIsAnimating( true ) )
					.catch( () => setHadUploadError( true ) );
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
						size="compact"
						variant="primary"
						onClick={ uploadImages }
					>
						{ _x( 'Upload', 'verb' ) }
					</Button>
				) }
			</div>
			{ hadUploadError && <p>{ __( 'Upload failed, try again.' ) }</p> }
		</PanelBody>
	);
}
