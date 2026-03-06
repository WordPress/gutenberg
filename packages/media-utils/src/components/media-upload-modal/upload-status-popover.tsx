/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button, Icon, Notice, Popover, Spinner } from '@wordpress/components';
import { check, chevronDown } from '@wordpress/icons';

export interface UploadingFile {
	id: string;
	name: string;
	status: 'uploading' | 'complete' | 'error';
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
		( f ) => f.status === 'uploading'
	);
	const errorFiles = uploadingFiles.filter( ( f ) => f.status === 'error' );
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

	let buttonLabel: string;
	if ( isUploading ) {
		buttonLabel = sprintf(
			// translators: %s: number of files being uploaded
			_n( 'Uploading %s file', 'Uploading %s files', activeFiles.length ),
			activeFiles.length.toLocaleString()
		);
	} else if ( hasErrors ) {
		buttonLabel = sprintf(
			// translators: %s: number of upload errors
			_n( '%s upload error', '%s upload errors', errorFiles.length ),
			errorFiles.length.toLocaleString()
		);
	} else {
		buttonLabel = __( 'Upload complete' );
	}

	return (
		<div className="media-upload-modal__upload-status">
			<Button
				className="media-upload-modal__upload-status__trigger"
				variant="tertiary"
				size="compact"
				onClick={ () => updateIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
				ref={ triggerRef }
			>
				{ isUploading && <Spinner /> }
				{ buttonLabel }
				<Icon icon={ chevronDown } size={ 24 } />
			</Button>
			{ isOpen && (
				<Popover
					className="media-upload-modal__upload-status__popover"
					placement="top-start"
					anchor={ triggerRef.current }
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
						<h3>{ __( 'Uploading' ) }</h3>
					</div>
					<ul className="media-upload-modal__upload-status__list">
						{ uploadingFiles.map( ( file ) => (
							<li
								key={ file.id }
								className="media-upload-modal__upload-status__item"
							>
								{ file.status === 'uploading' && <Spinner /> }
								{ file.status === 'complete' && (
									<Icon icon={ check } size={ 16 } />
								) }
								{ ( file.status === 'uploading' ||
									file.status === 'complete' ) && (
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
