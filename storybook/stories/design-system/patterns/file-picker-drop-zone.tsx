import type { DragEvent } from 'react';
import { DropZone, FormFileUpload } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Button, Stack } from '@wordpress/ui';

function preventFileNavigation( event: DragEvent ) {
	if ( event.dataTransfer.types.includes( 'Files' ) ) {
		event.preventDefault();
	}
}

export function FilePickerDropZone( { disabled = false } ) {
	const [ fileName, setFileName ] = useState( '' );
	const [ error, setError ] = useState( '' );

	function selectFiles( files: File[] ) {
		if ( disabled || ! files.length ) {
			return;
		}
		if ( files.length > 1 ) {
			setError( 'Choose one PNG file at a time.' );
			return;
		}
		const [ file ] = files;
		if ( ! file.name.toLowerCase().endsWith( '.png' ) ) {
			setError( `Choose a PNG image instead of ${ file.name }.` );
			return;
		}

		setFileName( file.name );
		setError( '' );
	}

	return (
		<fieldset
			disabled={ disabled }
			onDragOver={ preventFileNavigation }
			onDrop={ preventFileNavigation }
			style={ {
				position: 'relative',
				minInlineSize: 0,
				padding: 'var(--wpds-dimension-padding-lg)',
				border: 'var(--wpds-border-width-xs) dashed var(--wpds-color-stroke-surface-neutral)',
				borderRadius: 'var(--wpds-border-radius-md)',
			} }
		>
			<legend>Cover image</legend>
			<Stack direction="column" gap="sm" align="center">
				<span>
					{ disabled
						? 'File selection is disabled.'
						: 'Drop one PNG image here, or choose a file.' }
				</span>
				<FormFileUpload
					accept=".png"
					onChange={ ( { currentTarget } ) => {
						selectFiles( Array.from( currentTarget.files ?? [] ) );
						currentTarget.value = '';
					} }
					render={ ( { openFileDialog } ) => (
						<Button
							variant="outline"
							tone="neutral"
							disabled={ disabled }
							onClick={ openFileDialog }
						>
							Choose file…
						</Button>
					) }
				/>
				<output style={ { overflowWrap: 'anywhere' } }>
					{ fileName && (
						<>
							Selected: { fileName }
							<br />
						</>
					) }
					{ error }
				</output>
			</Stack>
			{ ! disabled && (
				<DropZone
					label="Drop cover image"
					onFilesDrop={ selectFiles }
				/>
			) }
		</fieldset>
	);
}
