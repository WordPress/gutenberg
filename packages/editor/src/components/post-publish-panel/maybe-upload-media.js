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

function Image( block ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	return (
		<motion.img
			tabIndex={ 0 }
			role="button"
			aria-label={ __( 'Select image block.' ) }
			onClick={ () => {
				selectBlock( block.clientId );
			} }
			onKeyDown={ ( event ) => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					selectBlock( block.clientId );
					event.preventDefault();
				}
			} }
			key={ block.clientId }
			alt={ block.attributes.alt }
			src={ block.attributes.url }
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
	const externalImages = flattenBlocks( editorBlocks ).filter(
		( block ) =>
			block.name === 'core/image' &&
			block.attributes.url &&
			! block.attributes.id
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	if ( ! mediaUpload || ! externalImages.length ) {
		return null;
	}

	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'External media' ) }
		</span>,
	];

	function uploadImages() {
		setIsUploading( true );
		setHadUploadError( false );
		Promise.all(
			externalImages.map( ( image ) =>
				window
					.fetch(
						image.attributes.url.includes( '?' )
							? image.attributes.url
							: image.attributes.url + '?'
					)
					.then( ( response ) => response.blob() )
					.then( ( blob ) =>
						new Promise( ( resolve, reject ) => {
							mediaUpload( {
								filesList: [ blob ],
								onFileChange: ( [ media ] ) => {
									if ( isBlobURL( media.url ) ) {
										return;
									}

									updateBlockAttributes( image.clientId, {
										id: media.id,
										url: media.url,
									} );
									resolve();
								},
								onError() {
									reject();
								},
							} );
						} ).then( () => setIsAnimating( true ) )
					)
					.catch( () => {
						setHadUploadError( true );
					} )
			)
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
					{ externalImages.map( ( image ) => {
						return <Image key={ image.clientId } { ...image } />;
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
