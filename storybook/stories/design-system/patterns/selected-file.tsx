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
 * Creates a URL for an image preview and revokes it when the file changes.
 *
 * @param file The chosen file.
 */
function usePreviewUrl( file: File ) {
	const [ url, setUrl ] = useState< string >();

	useEffect( () => {
		if ( ! file.type.startsWith( 'image/' ) ) {
			setUrl( undefined );
			return;
		}
		const objectUrl = URL.createObjectURL( file );
		setUrl( objectUrl );
		return () => URL.revokeObjectURL( objectUrl );
	}, [ file ] );

	return url;
}

/**
 * Shows a thumbnail or a file icon, the filename, and the file type and size,
 * on one line. The name is cut at the end, so the type and size stay visible.
 *
 * It renders only `span` elements, so it can be the content of a button.
 */
export function FileSummary( {
	file,
	status,
	isPending = false,
}: {
	file: File;
	/** Text after the type and size, such as "Uploaded". */
	status?: React.ReactNode;
	/**
	 * Whether the file is still on its way, such as during an upload. The name
	 * is weaker, and the type and size are hidden to make room for progress.
	 */
	isPending?: boolean;
} ) {
	const previewUrl = usePreviewUrl( file );
	const extension = getExtension( file.name );

	return (
		<Stack
			render={ <span /> }
			direction="row"
			align="center"
			gap="sm"
			className={ styles.summary }
		>
			<span className={ styles.thumbnail }>
				{ previewUrl ? (
					<img src={ previewUrl } alt="" />
				) : (
					<Icon icon={ fileIcon } />
				) }
			</span>
			<Text
				className={ `${ styles.name } ${
					isPending ? styles.weak : ''
				}` }
			>
				{ file.name }
			</Text>
			{ ! isPending && (
				<Text variant="body-sm" className={ styles.meta }>
					{ extension.slice( 1 ).toUpperCase() || 'File' }
					<span aria-hidden="true"> ·</span>{ ' ' }
					{ formatFileSize( file.size ) }
					{ status && (
						<>
							<span aria-hidden="true"> ·</span> { status }
						</>
					) }
				</Text>
			) }
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
		 * A progress bar for a file that's still on its way. It takes the place
		 * of the type and size, and the name is weaker until it's gone.
		 */
		progress?: React.ReactNode;
		/** Buttons before the remove button, such as "Retry". */
		actions?: React.ReactNode;
		/** Whether the remove button is disabled. */
		disabled?: boolean;
	}
>( function UnforwardedSelectedFile(
	{ file, onRemove, removeLabel, status, progress, actions, disabled },
	ref
) {
	return (
		<Stack
			direction="row"
			align="center"
			justify="space-between"
			gap="sm"
			className={ `${ styles.surface } ${ styles.row }` }
		>
			<FileSummary
				file={ file }
				status={ status }
				isPending={ !! progress }
			/>
			{ progress }
			{ actions }
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
