import type { FormEvent } from 'react';
import { speak } from '@wordpress/a11y';
import { FormFileUpload } from '@wordpress/components';
import { useId, useRef, useState } from '@wordpress/element';
import { Button, Fieldset, Stack, ValidityIndicator } from '@wordpress/ui';
import { getExtension, SelectedFile } from './selected-file';
import { importPattern, useSnackbars } from './file-picker-preview';
import previewStyles from './file-picker-preview.module.css';
import styles from './file-picker.module.css';

export function FilePickerButton() {
	const [ file, setFile ] = useState< File >();
	const [ error, setError ] = useState( '' );
	const [ isImporting, setIsImporting ] = useState( false );
	const chooseRef = useRef< HTMLButtonElement >( null );
	const errorId = useId();
	const snackbars = useSnackbars();

	async function onSubmit( event: FormEvent ) {
		event.preventDefault();
		// Hide an earlier confirmation, so it isn't read as this result.
		snackbars.hide();
		if ( ! file ) {
			setError( 'Choose a pattern file to import.' );
			chooseRef.current?.focus();
			return;
		}
		setIsImporting( true );
		setError( '' );
		try {
			const title = await importPattern( file );
			snackbars.show( `Imported “${ title }” from JSON.` );
			setFile( undefined );
		} catch {
			setError(
				`Couldn’t import ${ file.name }. Choose a pattern exported as JSON.`
			);
		} finally {
			setIsImporting( false );
		}
	}

	return (
		<form
			onSubmit={ onSubmit }
			className={ previewStyles[ 'with-snackbars' ] }
		>
			<Stack direction="column" gap="lg">
				<Fieldset.Root>
					<Fieldset.Legend>Pattern file (Required)</Fieldset.Legend>
					<Stack direction="column" gap="sm">
						<FormFileUpload
							accept=".json,application/json"
							onChange={ ( { currentTarget } ) => {
								const chosen = currentTarget.files?.[ 0 ];
								// Clear the input, so choosing the same file
								// again fires another change.
								currentTarget.value = '';
								if ( ! chosen ) {
									return;
								}
								// `accept` only filters the picker, so check
								// the file, by its type or its extension.
								if (
									chosen.type !== 'application/json' &&
									getExtension(
										chosen.name
									).toLowerCase() !== '.json'
								) {
									snackbars.hide();
									setError(
										`Couldn’t use ${ chosen.name }. Choose a JSON file.`
									);
									return;
								}
								setFile( chosen );
								setError( '' );
								speak( `${ chosen.name } selected.` );
							} }
							render={ ( { openFileDialog } ) => (
								<Button
									ref={ chooseRef }
									variant="outline"
									tone="neutral"
									disabled={ isImporting }
									aria-describedby={
										error ? errorId : undefined
									}
									onClick={ openFileDialog }
								>
									Choose file…
								</Button>
							) }
						/>
						{ file && (
							<SelectedFile
								file={ file }
								disabled={ isImporting }
								onRemove={ () => {
									speak( `${ file.name } removed.` );
									setFile( undefined );
									setError( '' );
									chooseRef.current?.focus();
								} }
							/>
						) }
					</Stack>
					<Fieldset.Description>
						A JSON file exported from another site.
					</Fieldset.Description>
					<div aria-live="polite" className={ styles.error }>
						{ error && (
							<ValidityIndicator
								id={ errorId }
								type="invalid"
								message={ error }
							/>
						) }
					</div>
				</Fieldset.Root>
				<Stack direction="row">
					<Button
						type="submit"
						loading={ isImporting }
						loadingAnnouncement="Importing pattern"
					>
						Import
					</Button>
				</Stack>
			</Stack>
			{ snackbars.list }
		</form>
	);
}
