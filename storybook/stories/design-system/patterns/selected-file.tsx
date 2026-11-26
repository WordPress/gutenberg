import { forwardRef, useEffect, useState } from '@wordpress/element';
import { closeSmall, file as fileIcon } from '@wordpress/icons';
import { Icon, IconButton, Stack, Text } from '@wordpress/ui';
import styles from './file-picker.module.css';

let lastId = 0;

/**
 * Returns a key for a new row. The same file can be chosen twice, so the key
 * can't come from the file. Unlike `crypto.randomUUID()`, this works on sites
 * served over plain HTTP.
 */
export function createId() {
	lastId += 1;
	return String( lastId );
}

const KB_IN_BYTES = 1024;
const MB_IN_BYTES = 1024 * KB_IN_BYTES;

/**
 * Formats a size in bytes, such as "812 KB" or "1.4 MB". Like WordPress's
 * `size_format()`, a kilobyte is 1,024 bytes.
 *
 * @param bytes The size of the file.
 */
export function formatFileSize( bytes: number ) {
	let [ value, unit ] = [ bytes, 'B' ];
	if ( bytes >= MB_IN_BYTES ) {
		[ value, unit ] = [ bytes / MB_IN_BYTES, 'MB' ];
	} else if ( bytes >= KB_IN_BYTES ) {
		[ value, unit ] = [ bytes / KB_IN_BYTES, 'KB' ];
	}
	return `${ value.toLocaleString( undefined, {
		maximumFractionDigits: 1,
	} ) } ${ unit }`;
}

/**
 * Returns the extension of a filename, including the dot, or an empty string.
 *
 * @param name The filename.
 */
export function getExtension( name: string ) {
	const index = name.lastIndexOf( '.' );
	return index > 0 ? name.slice( index ) : '';
}

/**
 * Shows a thumbnail for an image, or a file icon for any other file. The
 * preview URL is revoked when the file changes.
 */
function FileThumbnail( { file }: { file: File } ) {
	const [ previewUrl, setPreviewUrl ] = useState< string >();

	useEffect( () => {
		if ( ! file.type.startsWith( 'image/' ) ) {
			setPreviewUrl( undefined );
			return;
		}
		const objectUrl = URL.createObjectURL( file );
		setPreviewUrl( objectUrl );
		return () => URL.revokeObjectURL( objectUrl );
	}, [ file ] );

	return (
		<span className={ styles.thumbnail }>
			{ previewUrl ? (
				<img
					src={ previewUrl }
					alt=""
					// Some images, such as HEIC photos, can't be shown in
					// every browser. Show the file icon for them.
					onError={ () => setPreviewUrl( undefined ) }
				/>
			) : (
				<Icon icon={ fileIcon } />
			) }
		</span>
	);
}

/**
 * Shows the file type and size, such as "PNG · 812 KB". The filename can be
 * long, so the type also tells `report.pdf` from `report.png` at a glance.
 */
function FileDetails( {
	file,
	status,
}: {
	file: File;
	/** Text after the type and size, such as "Uploaded". */
	status?: React.ReactNode;
} ) {
	return (
		<Text variant="body-sm" className={ styles.weak }>
			{ getExtension( file.name ).slice( 1 ).toUpperCase() || 'File' }
			<span aria-hidden="true"> ·</span> { formatFileSize( file.size ) }
			{ status && (
				<>
					<span aria-hidden="true"> ·</span> { status }
				</>
			) }
		</Text>
	);
}

/**
 * Shows a thumbnail or a file icon, the filename, and the file type and size.
 * They share one line when they fit. In a narrow space, the type and size
 * move below the name, and a long name wraps, so it is never cut.
 *
 * It renders only phrasing content, so it can be the content of a button.
 */
export function FileSummary( { file }: { file: File } ) {
	return (
		<Stack
			render={ <span /> }
			direction="row"
			align="center"
			gap="sm"
			className={ styles.summary }
		>
			<FileThumbnail file={ file } />
			<span className={ styles.text }>
				<Text className={ styles.name }>{ file.name }</Text>
				<FileDetails file={ file } />
			</span>
		</Stack>
	);
}

/**
 * A chosen file with a visible remove button.
 *
 * The forwarded ref points to the remove button, so the caller can move focus
 * to another row after a removal.
 */
export const SelectedFile = forwardRef<
	HTMLButtonElement,
	{
		file: File;
		onRemove: () => void;
		/** The remove button's label. Defaults to "Remove" and the filename. */
		removeLabel?: string;
		/** Text after the type and size, such as "Uploaded". */
		status?: React.ReactNode;
		/**
		 * Whether to show the type and size. Without them, only the status
		 * shows, and it can be a `Badge`. Defaults to `true`.
		 */
		showDetails?: boolean;
		/**
		 * A progress bar for a file that's still on its way. It takes the place
		 * of the type and size, and the name is weaker until it's gone.
		 */
		progress?: React.ReactNode;
		/**
		 * Buttons after the status, such as "Retry". They stay with the status,
		 * so both move below the name together in a narrow row.
		 */
		actions?: React.ReactNode;
		/** Whether the remove button is disabled. */
		disabled?: boolean;
	}
>( function UnforwardedSelectedFile(
	{
		file,
		onRemove,
		removeLabel,
		status,
		showDetails = true,
		progress,
		actions,
		disabled,
	},
	ref
) {
	return (
		<Stack
			direction="row"
			align="center"
			gap="sm"
			className={ `${ styles.surface } ${ styles.row }` }
		>
			<FileThumbnail file={ file } />
			<div className={ styles.text }>
				<Text
					className={ `${ styles.name } ${
						progress ? styles.weak : ''
					}` }
				>
					{ file.name }
				</Text>
				<div className={ styles.trailing }>
					{ progress }
					{ ! progress && showDetails && (
						<FileDetails file={ file } status={ status } />
					) }
					{ ! progress && ! showDetails && status }
					{ actions }
				</div>
			</div>
			<IconButton
				ref={ ref }
				icon={ closeSmall }
				label={ removeLabel ?? `Remove ${ file.name }` }
				variant="minimal"
				tone="neutral"
				size="small"
				disabled={ disabled }
				onClick={ onRemove }
			/>
		</Stack>
	);
} );
