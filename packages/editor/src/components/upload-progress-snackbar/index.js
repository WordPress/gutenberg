/**
 * WordPress dependencies
 */
import { ProgressBar, Snackbar } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { store as uploadStore } from '@wordpress/upload-media';

/**
 * Renders a persistent snackbar in the editor chrome while media uploads are
 * in progress. The snackbar shows a progress bar, a `completed / total` count,
 * and either the active filename (single upload) or an "Uploading N files"
 * label (batch). It is gated by the `window.__clientSideMediaProcessing`
 * runtime flag and bypasses the notices store so that live-updating React
 * children (the progress bar) can be rendered without re-creating a notice
 * on every progress tick.
 *
 * @return {JSX.Element|null} The snackbar, or `null` when idle or the flag is off.
 */
export default function UploadProgressSnackbar() {
	const isClientSideMediaProcessingEnabled =
		window.__clientSideMediaProcessing;

	const items = useSelect(
		( select ) => {
			if ( ! isClientSideMediaProcessingEnabled ) {
				return [];
			}
			return select( uploadStore ).getItems();
		},
		[ isClientSideMediaProcessingEnabled ]
	);

	const active = items.length;

	// Track peak queue length during a session. Items are removed from the
	// queue on completion, so `total` has to be tracked separately.
	const peakRef = useRef( 0 );
	if ( active > peakRef.current ) {
		peakRef.current = active;
	}

	// Reset the peak one tick after the queue drains. Using an effect avoids
	// a race where a second batch starts on the same render the first empties.
	useEffect( () => {
		if ( active === 0 ) {
			peakRef.current = 0;
		}
	}, [ active ] );

	// Announce start and completion transitions once, not on every tick.
	const wasUploadingRef = useRef( false );
	useEffect( () => {
		if ( ! isClientSideMediaProcessingEnabled ) {
			return;
		}
		const isUploading = active > 0;
		if ( isUploading && ! wasUploadingRef.current ) {
			speak( __( 'Media upload started' ), 'polite' );
		} else if ( ! isUploading && wasUploadingRef.current ) {
			speak( __( 'Media upload complete' ), 'polite' );
		}
		wasUploadingRef.current = isUploading;
	}, [ active, isClientSideMediaProcessingEnabled ] );

	if ( ! isClientSideMediaProcessingEnabled || active === 0 ) {
		return null;
	}

	const total = peakRef.current;
	const completed = Math.max( 0, total - active );

	// Prefer averaged per-item progress when every in-flight item reports one;
	// otherwise fall back to `completed / total` so the bar still advances
	// before per-item progress is wired through the upload pipeline.
	const reportedProgressValues = items
		.map( ( item ) => item.progress )
		.filter( ( value ) => typeof value === 'number' );
	const hasFullPerItemProgress =
		reportedProgressValues.length === items.length && items.length > 0;
	let progress = 0;
	if ( hasFullPerItemProgress ) {
		progress =
			reportedProgressValues.reduce( ( sum, value ) => sum + value, 0 ) /
			reportedProgressValues.length;
	} else if ( total > 0 ) {
		progress = ( completed / total ) * 100;
	}

	const label =
		active > 1
			? sprintf(
					/* translators: %d: number of files currently uploading. */
					_n( 'Uploading %d file', 'Uploading %d files', active ),
					active
			  )
			: items[ 0 ]?.sourceFile?.name || __( 'Uploading' );

	const countLabel = sprintf(
		/* translators: 1: number of completed uploads, 2: total uploads. */
		__( '%1$d / %2$d' ),
		completed,
		total
	);

	return (
		<div className="editor-upload-progress-snackbar components-snackbar-list">
			<Snackbar
				className="editor-upload-progress-snackbar__snackbar"
				explicitDismiss
				spokenMessage=""
				politeness="polite"
			>
				<div className="editor-upload-progress-snackbar__body">
					<div className="editor-upload-progress-snackbar__heading">
						{ __( 'Uploading' ) }
					</div>
					<ProgressBar
						value={ progress }
						aria-label={ __( 'Media upload progress' ) }
					/>
					<div
						className="editor-upload-progress-snackbar__status"
						role="status"
						aria-live="polite"
					>
						{ sprintf(
							/* translators: 1: progress count (e.g. "3 / 10"), 2: filename or batch label. */
							__( '%1$s — %2$s' ),
							countLabel,
							label
						) }
					</div>
				</div>
			</Snackbar>
		</div>
	);
}
