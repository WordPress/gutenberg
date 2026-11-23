import { speak } from '@wordpress/a11y';
import { FormFileUpload } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import { Button, Fieldset, Stack } from '@wordpress/ui';
import { SelectedFile } from './selected-file';

export function FilePickerButton() {
	const [ file, setFile ] = useState< File >();
	const chooseRef = useRef< HTMLButtonElement >( null );

	return (
		<Fieldset.Root>
			<Fieldset.Legend>Pattern file</Fieldset.Legend>
			<Stack direction="column" gap="sm">
				<FormFileUpload
					accept=".json,application/json"
					onChange={ ( { currentTarget } ) => {
						const chosen = currentTarget.files?.[ 0 ];
						if ( chosen ) {
							setFile( chosen );
							speak( `${ chosen.name } selected.` );
						}
						// Clear the input, so choosing the same file again
						// fires another change.
						currentTarget.value = '';
					} }
					render={ ( { openFileDialog } ) => (
						<Button
							ref={ chooseRef }
							variant="outline"
							tone="neutral"
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
							chooseRef.current?.focus();
						} }
					/>
				) }
			</Stack>
			<Fieldset.Description>
				A JSON file exported from another site.
			</Fieldset.Description>
		</Fieldset.Root>
	);
}
