/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	ProgressBar,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { store as uploadStore } from '@wordpress/upload-media';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

/**
 * Renders a compact upload progress indicator inside the post summary
 * sidebar while one or more client-side media uploads are in progress.
 *
 * Mirrors the Media Library's "Uploading" pattern: a progress bar, a
 * completed / total count, and the filename of the item currently being
 * processed. Returns `null` when the upload queue is empty so it adds no
 * DOM clutter in the common case.
 *
 * @return {JSX.Element|null} The rendered indicator, or null when idle.
 */
export default function PostUploadIndicator() {
	// `__clientSideMediaProcessing` is the runtime gate used throughout the
	// editor (see use-upload-save-lock.js and block-library/image/edit.js).
	// Short-circuit when CSM is disabled so we don't subscribe to a store
	// that will never change.
	const summary = useSelect( ( select ) => {
		if ( ! window.__clientSideMediaProcessing ) {
			return null;
		}
		return select( uploadStore ).getUploadProgressSummary();
	}, [] );

	// Announce start and completion transitions to assistive technology
	// without chattering on every progress tick.
	const isUploading = !! summary;
	const wasUploading = usePrevious( isUploading );
	useEffect( () => {
		if ( isUploading && ! wasUploading ) {
			speak( __( 'Media upload started' ), 'polite' );
		} else if ( ! isUploading && wasUploading ) {
			speak( __( 'Media upload complete' ), 'polite' );
		}
	}, [ isUploading, wasUploading ] );

	if ( ! summary ) {
		return null;
	}

	const { total, completed, progress, currentFilename } = summary;

	const countLabel = sprintf(
		/* translators: 1: number of completed uploads, 2: total uploads. */
		__( '%1$d / %2$d' ),
		completed,
		total
	);

	const ariaLabel = currentFilename
		? sprintf(
				/* translators: 1: completed count, 2: total count, 3: filename. */
				__( 'Uploading media: %1$d of %2$d, currently %3$s' ),
				completed,
				total,
				currentFilename
		  )
		: sprintf(
				/* translators: 1: completed count, 2: total count. */
				__( 'Uploading media: %1$d of %2$d' ),
				completed,
				total
		  );

	return (
		<PostPanelRow
			className="editor-post-upload-indicator"
			label={ __( 'Uploading' ) }
		>
			<VStack
				spacing={ 1 }
				className="editor-post-upload-indicator__content"
			>
				<ProgressBar value={ progress } aria-label={ ariaLabel } />
				<span
					role="status"
					className="editor-post-upload-indicator__meta"
				>
					{ countLabel }
					{ currentFilename && (
						<>
							{ ' \u2014 ' }
							<span
								className="editor-post-upload-indicator__filename"
								title={ currentFilename }
							>
								{ currentFilename }
							</span>
						</>
					) }
				</span>
			</VStack>
		</PostPanelRow>
	);
}
