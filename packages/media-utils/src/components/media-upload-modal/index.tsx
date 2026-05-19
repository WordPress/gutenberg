/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { dispatch, useSelect } from '@wordpress/data';
// `@wordpress/block-editor` does not currently emit type declarations for its
// runtime exports (its tsconfig limits the TS project to a couple of files),
// so the import below is type-suppressed. Runtime resolution works via the
// package's CJS/ESM entries.
// prettier-ignore
// @ts-expect-error
import { privateApis as blockEditorPrivateApis, store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { Attachment } from '../../utils/types';
import { unlock } from '../../lock-unlock';

const { openMediaUploadModalKey } = unlock( blockEditorPrivateApis );

interface MediaUploadModalProps {
	/** Array of allowed media types. */
	allowedTypes?: string[];

	/**
	 * Whether multiple files can be selected.
	 *
	 * @default false
	 */
	multiple?: boolean;

	/** The currently selected media item(s). */
	value?: number | number[];

	/** Function called when media is selected. */
	onSelect: ( media: Attachment | Attachment[] ) => void;

	/** Function called when the modal is closed without selection. */
	onClose?: () => void;

	/** Function to handle media uploads. Defaults to `uploadMedia`. */
	onUpload?: ( args: {
		allowedTypes?: string[];
		filesList: File[];
		onFileChange?: ( attachments: Partial< Attachment >[] ) => void;
		onError?: ( error: Error ) => void;
		multiple?: boolean;
	} ) => void;

	/**
	 * Title for the modal.
	 *
	 * @default 'Select Media'
	 */
	title?: string;

	/** Whether the modal is open. */
	isOpen: boolean;

	/**
	 * Whether the modal can be closed by clicking outside or pressing escape.
	 *
	 * @default true
	 */
	isDismissible?: boolean;

	/** Additional CSS class for the modal. */
	modalClass?: string;

	/**
	 * Whether to show a search input.
	 *
	 * @default true
	 */
	search?: boolean;

	/** Label for the search input. */
	searchLabel?: string;
}

/**
 * Back-compat shim for the experimental `MediaUploadModal`.
 *
 * The actual UI now lives in `@wordpress/media-editor` and is mounted exactly
 * once at the editor root. This component preserves the previous prop API but
 * no longer renders its own `<Modal>` — instead, when `isOpen` flips to true
 * it dispatches an open action via the `openMediaUploadModalKey` settings
 * symbol (parallel to how the Image-block "Crop" entry opens the editor
 * modal). The dispatcher returns a session symbol so the shim can later
 * dispatch a guarded close that only acts on its own session.
 *
 * Outside a block-editor context the open function is undefined and the
 * shim silently no-ops. A dev-only warning is emitted on the first attempt
 * to make this visible to plugin authors during the prototype.
 * @param props
 */
export function MediaUploadModal( props: MediaUploadModalProps ) {
	const {
		isOpen,
		onSelect,
		onClose,
		onUpload,
		allowedTypes,
		multiple,
		value,
		title,
		isDismissible,
		modalClass,
		search,
		searchLabel,
	} = props;

	// Latest-callback refs so prop identity changes don't churn the dispatch
	// and the store never holds a stale closure.
	const onSelectRef = useRef( onSelect );
	const onCloseRef = useRef( onClose );
	const onUploadRef = useRef( onUpload );
	useEffect( () => {
		onSelectRef.current = onSelect;
	}, [ onSelect ] );
	useEffect( () => {
		onCloseRef.current = onClose;
	}, [ onClose ] );
	useEffect( () => {
		onUploadRef.current = onUpload;
	}, [ onUpload ] );

	const openMediaUploadModal = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()[
				openMediaUploadModalKey as unknown as string
			] as
				| ( ( args: Record< string, unknown > ) => symbol | undefined )
				| undefined,
		[]
	);

	// Track the session this shim instance owns. The store guards
	// `closeMediaUploadModal({ session })` so that an unmount cleanup from a
	// superseded shim cannot close the active modal.
	const sessionRef = useRef< symbol | null >( null );
	const wasOpenRef = useRef( false );

	// React to isOpen transitions (including initial mount with isOpen=true).
	useEffect( () => {
		if ( isOpen && ! wasOpenRef.current ) {
			if ( ! openMediaUploadModal ) {
				if (
					process.env.NODE_ENV !== 'production' &&
					typeof window !== 'undefined'
				) {
					// eslint-disable-next-line no-console
					console.warn(
						'`MediaUploadModal` rendered with `isOpen` but no block-editor settings host is present, ' +
							'or `window.__experimentalDataViewsMediaModal` is not enabled. The modal will not open.'
					);
				}
				return;
			}
			sessionRef.current =
				openMediaUploadModal( {
					allowedTypes,
					multiple,
					value,
					title,
					isDismissible,
					modalClass,
					search,
					searchLabel,
					onSelect: ( media: Attachment | Attachment[] ) =>
						onSelectRef.current?.( media ),
					onClose: () => onCloseRef.current?.(),
					onUpload: onUploadRef.current
						? (
								args: Parameters<
									NonNullable< typeof onUpload >
								>[ 0 ]
						  ) => onUploadRef.current!( args )
						: undefined,
				} ) ?? null;
		} else if ( ! isOpen && wasOpenRef.current ) {
			closeBySession( sessionRef.current );
			sessionRef.current = null;
		}
		wasOpenRef.current = isOpen;
		// We deliberately depend only on `isOpen` and the open function — the
		// other props are captured on open and updated via refs while open.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isOpen, openMediaUploadModal ] );

	// Unmount cleanup: if the shim unmounts while the singleton is still
	// active for this session, dispatch a close. (Guarded by session in the
	// store, so this is a no-op if another shim has taken over.)
	useEffect( () => {
		return () => {
			if ( wasOpenRef.current ) {
				closeBySession( sessionRef.current );
			}
		};
	}, [] );

	return null;
}

/**
 * Closes the singleton media upload modal by dispatching against the
 * `core/media-editor` store by name. The string lookup avoids a static dep
 * on `@wordpress/media-editor` from `@wordpress/media-utils` — keeping the
 * layering "media-editor → media-utils" intact rather than circular. The
 * store is registered when the editor mounts the unified modal, so the
 * dispatch is a no-op if the modal isn't currently active.
 * @param session
 */
function closeBySession( session: symbol | null ) {
	if ( ! session ) {
		return;
	}
	// String-literal store lookup is intentional: importing the store
	// descriptor from `@wordpress/media-editor` would invert the package
	// layering (media-editor already depends on media-utils), so the close
	// is dispatched by name. The store is registered when the editor mounts
	// the unified modal; otherwise the dispatch is a harmless no-op.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const actions = dispatch( 'core/media-editor' ) as
		| { closeMediaUploadModal?: ( args: { session: symbol } ) => void }
		| undefined;
	actions?.closeMediaUploadModal?.( { session } );
}

export default MediaUploadModal;
