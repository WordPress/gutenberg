/**
 * WordPress dependencies
 */
import { PanelBody, Button, Spinner } from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as uploadStore } from '@wordpress/upload-media';
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getImageAttachmentIds } from '../provider/use-missing-sizes-check';

export default function MaybeMissingSizesPanel() {
	const [ isGenerating, setIsGenerating ] = useState( false );
	const [ progress, setProgress ] = useState( { current: 0, total: 0 } );
	const checkIntervalRef = useRef( null );
	const registry = useRegistry();
	const { invalidateResolution } = useDispatch( coreStore );

	const isEnabled = !! window.__clientSideMediaProcessing;

	// Clean up polling interval on unmount.
	useEffect( () => {
		return () => {
			if ( checkIntervalRef.current ) {
				clearInterval( checkIntervalRef.current );
			}
		};
	}, [] );

	const blocks = useSelect(
		( select ) => {
			if ( ! isEnabled ) {
				return [];
			}
			return select( blockEditorStore ).getBlocks();
		},
		[ isEnabled ]
	);

	const attachmentsWithMissingSizes = useSelect(
		( select ) => {
			if ( ! isEnabled || ! blocks.length ) {
				return [];
			}
			const ids = getImageAttachmentIds( blocks );
			const results = [];
			for ( const id of ids ) {
				const attachment = select( coreStore ).getEntityRecord(
					'postType',
					'attachment',
					id,
					{ context: 'edit' }
				);
				if ( attachment?.missing_image_sizes?.length ) {
					results.push( attachment );
				}
			}
			return results;
		},
		[ isEnabled, blocks ]
	);

	if ( ! isGenerating && ! attachmentsWithMissingSizes.length ) {
		return null;
	}

	async function generateAllMissingSizes() {
		const total = attachmentsWithMissingSizes.length;
		setIsGenerating( true );
		setProgress( { current: 0, total } );

		for ( const attachment of attachmentsWithMissingSizes ) {
			unlock(
				registry.dispatch( uploadStore )
			).queueMissingSizeGeneration( {
				attachmentId: attachment.id,
				sourceUrl: attachment.source_url,
				missingSizes: attachment.missing_image_sizes,
			} );
		}

		// Poll for completion by checking if any attachments still have missing sizes.
		checkIntervalRef.current = setInterval( async () => {
			let remaining = 0;
			for ( const attachment of attachmentsWithMissingSizes ) {
				await invalidateResolution( 'getEntityRecord', [
					'postType',
					'attachment',
					attachment.id,
					{ context: 'edit' },
				] );
				const updated = registry
					.select( coreStore )
					.getEntityRecord(
						'postType',
						'attachment',
						attachment.id,
						{ context: 'edit' }
					);
				if ( updated?.missing_image_sizes?.length ) {
					remaining++;
				}
			}
			const completed = total - remaining;
			setProgress( { current: completed, total } );
			if ( remaining === 0 ) {
				clearInterval( checkIntervalRef.current );
				checkIntervalRef.current = null;
				setIsGenerating( false );
			}
		}, 3000 );
	}

	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'Missing image sizes' ) }
		</span>,
	];

	return (
		<PanelBody initialOpen title={ panelBodyTitle }>
			<p>
				{ sprintf(
					/* translators: %d: number of images with missing sub-sizes */
					__( '%d image(s) are missing sub-sizes.' ),
					attachmentsWithMissingSizes.length
				) }
			</p>
			{ isGenerating ? (
				<>
					<Spinner />
					<span style={ { marginLeft: '8px' } }>
						{ sprintf(
							/* translators: 1: current image number, 2: total images */
							__(
								'Generating missing sizes for image %1$d of %2$d'
							),
							progress.current + 1,
							progress.total
						) }
					</span>
				</>
			) : (
				<Button
					variant="secondary"
					onClick={ generateAllMissingSizes }
				>
					{ __( 'Generate missing sizes' ) }
				</Button>
			) }
		</PanelBody>
	);
}
