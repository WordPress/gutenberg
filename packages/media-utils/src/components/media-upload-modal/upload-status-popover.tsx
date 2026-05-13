/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button, Icon, Notice, Popover, Spinner } from '@wordpress/components';
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
	const triggerRef = useRef< HTMLButtonElement >( null );

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
		<div className="media-upload-modal__upload-status">
			{ isUploading && <Spinner /> }
			<Button
				className="media-upload-modal__upload-status__trigger"
				size="compact"
				icon={ chevronDown }
				iconPosition="right"
				onClick={ () => updateIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
				ref={ triggerRef }
			>
				{ buttonLabel }
			</Button>
			{ isOpen && (
				<Popover
					className="media-upload-modal__upload-status__popover"
					placement="top-start"
					offset={ 8 }
					anchor={ triggerRef.current }
					focusOnMount
					onClose={ () => {
						// Let the button's onClick handle toggling when
						// the close was triggered by clicking the trigger.
						if (
							triggerRef.current?.contains(
								triggerRef.current.ownerDocument.activeElement
							)
						) {
							return;
						}
						updateIsOpen( false );
					} }
				>
					<div className="media-upload-modal__upload-status__header">
						<h3>{ popoverHeading }</h3>
					</div>
					<ul className="media-upload-modal__upload-status__list">
						{ uploadingFiles.map( ( file ) => (
							<li
								key={ file.id }
								className="media-upload-modal__upload-status__item"
							>
								{ file.status === 'uploading' && <Spinner /> }
								{ file.status === 'uploaded' && (
									<Icon icon={ check } size={ 16 } />
								) }
								{ ( file.status === 'uploading' ||
									file.status === 'uploaded' ) && (
									<span
										className="media-upload-modal__upload-status__filename"
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
