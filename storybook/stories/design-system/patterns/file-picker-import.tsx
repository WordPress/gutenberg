import { FormFileUpload } from '@wordpress/components';
import { useId, useState } from '@wordpress/element';
import { Button, Stack } from '@wordpress/ui';
import { FilePickerError } from './selected-file';
import { importPattern, useSnackbars } from './file-picker-preview';

export function FilePickerImport() {
	const [ isImporting, setIsImporting ] = useState( false );
	const [ error, setError ] = useState( '' );
	const errorId = useId();
	const snackbars = useSnackbars();

	async function importFile( file: File ) {
		setIsImporting( true );
		setError( '' );
		// Hide an earlier confirmation, so it isn't read as this result.
		snackbars.hide();
		try {
			const title = await importPattern( file );
			snackbars.show( `Imported “${ title }” from JSON.` );
		} catch {
			setError(
				`Couldn’t import ${ file.name }. Choose a pattern exported as JSON.`
			);
		} finally {
			setIsImporting( false );
		}
	}

	return (
		<Stack direction="column" align="flex-start" gap="sm">
			<FormFileUpload
				accept=".json,application/json"
				onChange={ ( { currentTarget } ) => {
					const file = currentTarget.files?.[ 0 ];
					currentTarget.value = '';
					if ( file ) {
						importFile( file );
					}
				} }
				render={ ( { openFileDialog } ) => (
					<Button
						variant="outline"
						tone="neutral"
						loading={ isImporting }
						loadingAnnouncement="Importing pattern"
						aria-describedby={ error ? errorId : undefined }
						onClick={ openFileDialog }
					>
						Import pattern from JSON…
					</Button>
				) }
			/>
			<FilePickerError id={ errorId } message={ error } />
			{ snackbars.list }
		</Stack>
	);
}
