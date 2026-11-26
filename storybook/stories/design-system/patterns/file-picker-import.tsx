import { FormFileUpload } from '@wordpress/components';
import { useId, useState } from '@wordpress/element';
import { Button, Stack, ValidityIndicator } from '@wordpress/ui';
import { importPattern, useSnackbars } from './file-picker-preview';
import previewStyles from './file-picker-preview.module.css';
import styles from './file-picker.module.css';

export function FilePickerImport() {
	const [ isImporting, setIsImporting ] = useState( false );
	const [ error, setError ] = useState( '' );
	const errorId = useId();
	const snackbars = useSnackbars();

	async function importFile( file: File ) {
		setIsImporting( true );
		setError( '' );
		try {
			const title = await importPattern( file );
			snackbars.show( `Imported “${ title }” from JSON.` );
		} catch {
			snackbars.hide();
			setError(
				`Couldn’t import ${ file.name }. Choose a pattern exported as JSON.`
			);
		} finally {
			setIsImporting( false );
		}
	}

	return (
		<Stack
			direction="column"
			align="flex-start"
			gap="sm"
			className={ previewStyles[ 'with-snackbars' ] }
		>
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
			<div aria-live="polite" className={ styles.error }>
				{ error && (
					<ValidityIndicator
						id={ errorId }
						type="invalid"
						message={ error }
					/>
				) }
			</div>
			{ snackbars.list }
		</Stack>
	);
}
