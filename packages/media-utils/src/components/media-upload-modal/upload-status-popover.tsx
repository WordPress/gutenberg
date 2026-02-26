/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button, Popover, Spinner } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

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
				icon={ chevronDown }
				iconPosition="right"
				onClick={ () => updateIsOpen( ! isOpen ) }
			>
				{ isUploading && <Spinner /> }
				{ buttonLabel }
			</Button>
			{ isOpen && (
				<Popover
					className="media-upload-modal__upload-status__popover"
					placement="top-start"
					onClose={ () => updateIsOpen( false ) }
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
								<span className="media-upload-modal__upload-status__filename">
									{ file.name }
								</span>
								{ file.status === 'uploading' && <Spinner /> }
								{ file.status === 'error' && (
									<span className="media-upload-modal__upload-status__error">
										{ file.error }
										{ onDismissError && (
											<Button
												size="compact"
												variant="link"
												isDestructive
												onClick={ () =>
													onDismissError( file.id )
												}
											>
												{ __( 'Dismiss' ) }
											</Button>
										) }
									</span>
								) }
							</li>
						) ) }
					</ul>
				</Popover>
			) }
		</div>
	);
}
