/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Button,
	Icon as WCIcon,
	Notice,
	Popover,
	Spinner,
} from '@wordpress/components';
import { check, chevronDown } from '@wordpress/icons';

export interface UploadingFile {
	id: string;
	batchId: string;
	name: string;
	status: 'uploading' | 'uploaded' | 'error';
	error?: string;
}

interface UploadStatusPopoverProps {
	uploadingFiles: UploadingFile[];
	onDismissError?: ( fileId: string ) => void;
	onOpenChange?: ( open: boolean ) => void;
}

export function UploadStatusPopover( {
	uploadingFiles,
	onDismissError,
	onOpenChange,
}: UploadStatusPopoverProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ prevHadErrors, setPrevHadErrors ] = useState( false );
	// `Popover` needs an anchor element it can read at render time. Storing
	// the trigger button via a callback ref + state — rather than `useRef`
	// — keeps us out of the "Cannot access refs during render" rule and
	// re-renders the Popover when the anchor mounts.
	const [ triggerElement, setTriggerElement ] =
		useState< HTMLButtonElement | null >( null );

	const updateIsOpen = useCallback(
		( open: boolean ) => {
			setIsOpen( open );
			onOpenChange?.( open );
		},
		[ onOpenChange ]
	);

	const activeFiles = uploadingFiles.filter(
		( file ) => file.status === 'uploading'
	);
	const errorFiles = uploadingFiles.filter(
		( file ) => file.status === 'error'
	);
	const hasErrors = errorFiles.length > 0;
	const isUploading = activeFiles.length > 0;

	// Auto-expand when an error occurs.
	useEffect( () => {
		if ( hasErrors && ! prevHadErrors ) {
			updateIsOpen( true );
		}
		setPrevHadErrors( hasErrors );
	}, [ hasErrors, prevHadErrors, updateIsOpen ] );

	if ( uploadingFiles.length === 0 ) {
		return null;
	}

	let buttonLabel, popoverHeading: string;
	if ( isUploading ) {
		buttonLabel = sprintf(
			// translators: %s: number of files being uploaded
			_n( 'Uploading %s file', 'Uploading %s files', activeFiles.length ),
			activeFiles.length.toLocaleString()
		);
		popoverHeading = __( 'Uploading' );
	} else if ( hasErrors ) {
		buttonLabel = sprintf(
			// translators: %s: number of upload errors
			_n( '%s upload error', '%s upload errors', errorFiles.length ),
			errorFiles.length.toLocaleString()
		);
		popoverHeading = __( 'Upload errors' );
	} else {
		buttonLabel = __( 'Upload complete' );
		popoverHeading = __( 'Upload complete' );
	}

	return (
		<div className="media-modal-browser__upload-status">
			{ isUploading && <Spinner /> }
			<Button
				className="media-modal-browser__upload-status__trigger"
				size="compact"
				icon={ chevronDown }
				iconPosition="right"
				onClick={ () => updateIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
				ref={ setTriggerElement }
			>
				{ buttonLabel }
			</Button>
			{ isOpen && (
				<Popover
					className="media-modal-browser__upload-status__popover"
					placement="top-start"
					offset={ 8 }
					anchor={ triggerElement }
					focusOnMount
					onClose={ () => {
						// Let the button's onClick handle toggling when
						// the close was triggered by clicking the trigger.
						if (
							triggerElement?.contains(
								triggerElement.ownerDocument.activeElement
							)
						) {
							return;
						}
						updateIsOpen( false );
					} }
				>
					<div className="media-modal-browser__upload-status__header">
						<h3>{ popoverHeading }</h3>
					</div>
					<ul className="media-modal-browser__upload-status__list">
						{ uploadingFiles.map( ( file ) => (
							<li
								key={ file.id }
								className="media-modal-browser__upload-status__item"
							>
								{ file.status === 'uploading' && <Spinner /> }
								{ file.status === 'uploaded' && (
									<WCIcon icon={ check } size={ 16 } />
								) }
								{ ( file.status === 'uploading' ||
									file.status === 'uploaded' ) && (
									<span
										className="media-modal-browser__upload-status__filename"
										title={ file.name }
									>
										{ file.name }
									</span>
								) }
								{ file.status === 'error' && (
									<Notice
										status="error"
										isDismissible={ !! onDismissError }
										onRemove={ () =>
											onDismissError?.( file.id )
										}
									>
										{ file.name }: { file.error }
									</Notice>
								) }
							</li>
						) ) }
					</ul>
				</Popover>
			) }
		</div>
	);
}
