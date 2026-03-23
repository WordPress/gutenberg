/**
 * WordPress dependencies
 */
import { PanelBody, Button, Spinner } from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as uploadStore } from '@wordpress/upload-media';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getImageAttachmentIds } from '../provider/use-missing-sizes-check';

export default function MaybeMissingSizesPanel() {
	const [ isGenerating, setIsGenerating ] = useState( false );
	const registry = useRegistry();
	const { invalidateResolution } = useDispatch( coreStore );

	const isEnabled = !! window.__clientSideMediaProcessing;

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

	if ( ! attachmentsWithMissingSizes.length ) {
		return null;
	}

	async function generateAllMissingSizes() {
		setIsGenerating( true );

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
		const checkInterval = setInterval( async () => {
			let allDone = true;
			for ( const attachment of attachmentsWithMissingSizes ) {
				await invalidateResolution( 'getEntityRecord', [
					'postType',
					'attachment',
					attachment.id,
					{ context: 'edit' },
				] );
				const updated = registry
					.select( coreStore )
					.getEntityRecord( 'postType', 'attachment', attachment.id, {
						context: 'edit',
					} );
				if ( updated?.missing_image_sizes?.length ) {
					allDone = false;
					break;
				}
			}
			if ( allDone ) {
				clearInterval( checkInterval );
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
			<p>{ __( 'Some images are missing sub sizes.' ) }</p>
			{ isGenerating ? (
				<Spinner />
			) : (
				<Button variant="link" onClick={ generateAllMissingSizes }>
					{ __( 'Generate' ) }
				</Button>
			) }
		</PanelBody>
	);
}
