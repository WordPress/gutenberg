import type { DragEvent } from 'react';
import { speak } from '@wordpress/a11y';
import { DropZone, FormFileUpload } from '@wordpress/components';
import { useId, useRef, useState } from '@wordpress/element';
import { closeSmall, plus } from '@wordpress/icons';
import {
	Button,
	Fieldset,
	Icon,
	IconButton,
	Stack,
	Text,
	ValidityIndicator,
} from '@wordpress/ui';
import { FileSummary, getExtension } from './selected-file';
import styles from './file-picker.module.css';

/**
 * Stops a file dropped beside the drop area, or on a disabled field, from
 * opening in the browser tab.
 *
 * @param event The drag event.
 */
function preventFileNavigation( event: DragEvent< HTMLFieldSetElement > ) {
	if ( event.dataTransfer.types.includes( 'Files' ) ) {
		event.preventDefault();
		if ( event.currentTarget.disabled ) {
			event.dataTransfer.dropEffect = 'none';
		}
	}
}

export function FilePickerDropZone( { disabled = false } ) {
	const [ file, setFile ] = useState< File >();
	const [ error, setError ] = useState( '' );
	const chooseRef = useRef< HTMLButtonElement >( null );
	const errorId = useId();

	function chooseFiles( files: File[] ) {
		if ( ! files.length ) {
			return;
		}
		if ( files.length > 1 ) {
			setError(
				`Couldn’t use ${ files.length } files. Choose one PNG image.`
			);
			return;
		}
		const [ chosen ] = files;
		if ( getExtension( chosen.name ).toLowerCase() !== '.png' ) {
			setError( `Couldn’t use ${ chosen.name }. Choose a PNG image.` );
			return;
		}
		setFile( chosen );
		setError( '' );
		speak( `${ chosen.name } selected.` );
	}

	function removeFile() {
		if ( ! file ) {
			return;
		}
		speak( `${ file.name } removed.` );
		setFile( undefined );
		setError( '' );
		// The remove button is gone, so move focus back to the drop area.
		chooseRef.current?.focus();
	}

	return (
		<Fieldset.Root
			// The drop target covers the whole field, so the overlay has room for
			// its icon and label, and a file dropped on the legend or description
			// doesn't open in the browser tab.
			className={ styles[ 'drop-target' ] }
			disabled={ disabled }
			onDragOver={ preventFileNavigation }
			onDrop={ preventFileNavigation }
		>
			<Fieldset.Legend>Cover image (Optional)</Fieldset.Legend>
			<FormFileUpload
				accept=".png,image/png"
				onChange={ ( { currentTarget } ) => {
					chooseFiles( Array.from( currentTarget.files ?? [] ) );
					// Clear the input, so choosing the same file again fires
					// another change.
					currentTarget.value = '';
				} }
				render={ ( { openFileDialog } ) => (
					<Stack
						direction="row"
						align="center"
						gap="sm"
						className={ styles.surface }
					>
						<Button
							ref={ chooseRef }
							variant="unstyled"
							className={ styles.choose }
							disabled={ disabled }
							aria-label={
								file ? `Replace ${ file.name }` : undefined
							}
							aria-describedby={ error ? errorId : undefined }
							onClick={ openFileDialog }
						>
							{ file ? (
								<FileSummary file={ file } />
							) : (
								<Stack
									render={ <span /> }
									direction="row"
									align="center"
									gap="sm"
								>
									<span className={ styles.thumbnail }>
										<Icon icon={ plus } />
									</span>
									<Text className={ styles.prompt }>
										Add an image
									</Text>
								</Stack>
							) }
						</Button>
						{ file && (
							<IconButton
								className={ styles.remove }
								icon={ closeSmall }
								label={ `Remove ${ file.name }` }
								variant="minimal"
								tone="neutral"
								size="small"
								disabled={ disabled }
								onClick={ removeFile }
							/>
						) }
					</Stack>
				) }
			/>
			{ ! disabled && (
				<DropZone
					label="Drop to use as the cover image"
					onFilesDrop={ chooseFiles }
				/>
			) }
			<Fieldset.Description>
				Drop one PNG here, or choose a file.
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
