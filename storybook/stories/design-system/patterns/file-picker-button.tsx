import { speak } from '@wordpress/a11y';
import { FormFileUpload } from '@wordpress/components';
import { useId, useRef, useState } from '@wordpress/element';
import { Button, Fieldset, Stack, ValidityIndicator } from '@wordpress/ui';
import { getExtension, SelectedFile } from './selected-file';

export function FilePickerButton() {
	const [ file, setFile ] = useState< File >();
	const [ error, setError ] = useState( '' );
	const chooseRef = useRef< HTMLButtonElement >( null );
	const errorId = useId();

	return (
		<Fieldset.Root>
			<Fieldset.Legend>Pattern file</Fieldset.Legend>
			<Stack direction="column" gap="sm">
				<FormFileUpload
					accept=".json,application/json"
					onChange={ ( { currentTarget } ) => {
						const chosen = currentTarget.files?.[ 0 ];
						// Clear the input, so choosing the same file again
						// fires another change.
						currentTarget.value = '';
						if ( ! chosen ) {
							return;
						}
						// `accept` only filters the picker, so check the file.
						if (
							getExtension( chosen.name ).toLowerCase() !==
							'.json'
						) {
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
							aria-describedby={ error ? errorId : undefined }
							onClick={ openFileDialog }
						>
							Choose file…
						</Button>
					) }
				/>
				{ file && (
					<SelectedFile
						file={ file }
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
			<div aria-live="polite">
				{ error && (
					<ValidityIndicator
						id={ errorId }
						type="invalid"
						message={ error }
					/>
				) }
			</div>
		</Fieldset.Root>
	);
}
