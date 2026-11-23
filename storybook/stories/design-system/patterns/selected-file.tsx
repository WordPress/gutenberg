import { forwardRef, useEffect, useState } from '@wordpress/element';
import { closeSmall, file as fileIcon } from '@wordpress/icons';
import { Icon, IconButton, Stack, Text } from '@wordpress/ui';
import styles from './file-picker.module.css';

/**
 * Formats a size in bytes, such as "812 kB" or "1.4 MB".
 *
 * @param bytes The size of the file.
 */
export function formatFileSize( bytes: number ) {
	const [ value, unit ] =
		bytes < 1_000_000
			? [ Math.max( 1, Math.round( bytes / 1_000 ) ), 'kilobyte' ]
			: [ bytes / 1_000_000, 'megabyte' ];
	return new Intl.NumberFormat( undefined, {
		style: 'unit',
		unit,
		maximumFractionDigits: 1,
	} ).format( value );
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
 * Shows a thumbnail or a file icon, the filename, and the file type and size.
 *
 * It renders only `span` elements, so it can be the content of a button.
 */
export function FileSummary( {
	file,
	showDetails = true,
	status,
}: {
	file: File;
	/** Whether to show the file type and size below the name. */
	showDetails?: boolean;
	/** Text after the type and size, such as "Uploaded". */
	status?: React.ReactNode;
} ) {
	const previewUrl = usePreviewUrl( file );
	const extension = getExtension( file.name );

	return (
		<Stack
			render={ <span /> }
			direction="row"
			align="center"
			gap="md"
			className={ styles.details }
		>
			<span className={ styles.thumbnail }>
				{ previewUrl ? (
					<img src={ previewUrl } alt="" />
				) : (
					<Icon icon={ fileIcon } />
				) }
			</span>
			<Stack
				render={ <span /> }
				direction="column"
				className={ styles.details }
			>
				<Text className={ styles.name }>{ file.name }</Text>
				{ showDetails && (
					<Text variant="body-sm" className={ styles.weak }>
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
		/** Content below the file details, such as a progress bar. */
		footer?: React.ReactNode;
		/** Buttons before the remove button, such as "Retry". */
		actions?: React.ReactNode;
	}
>( function UnforwardedSelectedFile(
	{ file, onRemove, removeLabel, status, footer, actions },
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
			<Stack direction="column" gap="sm" className={ styles.grow }>
				<FileSummary file={ file } status={ status } />
				{ footer }
			</Stack>
			{ actions }
			<IconButton
				ref={ ref }
				icon={ closeSmall }
				label={ removeLabel ?? `Remove ${ file.name }` }
				variant="minimal"
				tone="neutral"
				size="compact"
				onClick={ onRemove }
			/>
		</Stack>
	);
} );
