/**
 * WordPress dependencies
 */
import { Button, Spinner } from '@wordpress/components';
import { useSelect, useRegistry } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as uploadStore } from '@wordpress/upload-media';
import { useState, useRef, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import PostPanelRow from '../post-panel-row';
import useMissingSizes from '../../hooks/use-missing-sizes';

export default function PostMissingSizesNotice() {
	const [ isGenerating, setIsGenerating ] = useState( false );
	const [ progress, setProgress ] = useState( { current: 0, total: 0 } );
	const checkIntervalRef = useRef( null );
	const registry = useRegistry();

	const isPublished = useSelect(
		( select ) => select( editorStore ).isCurrentPostPublished(),
		[]
	);

	const { attachmentsWithMissingSizes, setAttachmentsWithMissingSizes } =
		useMissingSizes();

	// Clean up polling interval on unmount.
	useEffect( () => {
		return () => {
			if ( checkIntervalRef.current ) {
				clearInterval( checkIntervalRef.current );
			}
		};
	}, [] );

	if (
		! isPublished ||
		( ! isGenerating && ! attachmentsWithMissingSizes.length )
	) {
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

		// Poll for completion.
		checkIntervalRef.current = setInterval( async () => {
			let remaining = 0;
			for ( const attachment of attachmentsWithMissingSizes ) {
				try {
					const updated = await apiFetch( {
						path: addQueryArgs( `/wp/v2/media/${ attachment.id }`, {
							context: 'edit',
							_fields: 'id,missing_image_sizes',
						} ),
					} );
					if ( updated?.missing_image_sizes?.length ) {
						remaining++;
					}
				} catch {
					// Skip attachments that can't be fetched.
				}
			}
			const completed = total - remaining;
			setProgress( { current: completed, total } );
			if ( remaining === 0 ) {
				clearInterval( checkIntervalRef.current );
				checkIntervalRef.current = null;
				setIsGenerating( false );
				setAttachmentsWithMissingSizes( [] );
			}
		}, 3000 );
	}

	if ( isGenerating ) {
		return (
			<PostPanelRow label={ __( 'Media' ) }>
				<Spinner />
				<span>
					{ sprintf(
						/* translators: 1: current image number, 2: total images */
						__( '%1$d / %2$d' ),
						progress.current,
						progress.total
					) }
				</span>
			</PostPanelRow>
		);
	}

	return (
		<PostPanelRow label={ __( 'Media' ) }>
			<Button
				size="compact"
				variant="tertiary"
				onClick={ generateAllMissingSizes }
			>
				{ sprintf(
					/* translators: %d: number of images with missing sub-sizes */
					__( 'Fix missing image sizes (%d)' ),
					attachmentsWithMissingSizes.length
				) }
			</Button>
		</PostPanelRow>
	);
}
