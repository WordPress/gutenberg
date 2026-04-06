/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getImageAttachmentIds } from '../components/provider/use-missing-sizes-check';

/**
 * Hook that detects images with missing sub-sizes in the current post.
 *
 * Uses direct REST API calls (apiFetch) to avoid polluting the core-data
 * entity store, which can cause the publish button label to change.
 *
 * @return {Object} Object with `attachmentsWithMissingSizes` array and `isChecking` boolean.
 */
export default function useMissingSizes() {
	const [ attachmentsWithMissingSizes, setAttachmentsWithMissingSizes ] =
		useState( [] );
	const [ isChecking, setIsChecking ] = useState( false );
	const hasCheckedRef = useRef( false );

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

	useEffect( () => {
		if ( ! isEnabled || ! blocks.length || hasCheckedRef.current ) {
			return;
		}

		const ids = getImageAttachmentIds( blocks );
		if ( ! ids.size ) {
			return;
		}

		hasCheckedRef.current = true;
		setIsChecking( true );

		async function checkMissingSizes() {
			const results = [];
			for ( const id of ids ) {
				try {
					const attachment = await apiFetch( {
						path: addQueryArgs( `/wp/v2/media/${ id }`, {
							context: 'edit',
							_fields: 'id,missing_image_sizes,source_url',
						} ),
					} );
					if ( attachment?.missing_image_sizes?.length ) {
						results.push( attachment );
					}
				} catch {
					// Skip attachments that can't be fetched.
				}
			}
			setAttachmentsWithMissingSizes( results );
			setIsChecking( false );
		}

		checkMissingSizes();
	}, [ isEnabled, blocks ] );

	return {
		attachmentsWithMissingSizes,
		setAttachmentsWithMissingSizes,
		isChecking,
	};
}
