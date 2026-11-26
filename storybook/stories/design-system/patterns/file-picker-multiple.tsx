import type { RefObject } from 'react';
import { speak } from '@wordpress/a11y';
import { DropZone, FormFileUpload } from '@wordpress/components';
import { createRef, useId, useRef, useState } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import { Button, Fieldset, Icon, Stack, Text } from '@wordpress/ui';
import {
	createId,
	FilePickerError,
	formatFileSize,
	getExtension,
	SelectedFile,
} from './selected-file';
import styles from './file-picker.module.css';

const ACCEPTED_EXTENSIONS = [ '.pdf', '.jpg', '.jpeg', '.png' ];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

type Entry = {
	id: string;
	file: File;
	/** The row's remove button, so focus can move to it after a removal. */
	removeRef: RefObject< HTMLButtonElement | null >;
};

function getPrompt( count: number ) {
	if ( count >= MAX_FILES ) {
		return `${ MAX_FILES } of ${ MAX_FILES } files added`;
	}
	return count ? 'Add more files' : 'Add files';
}

export function FilePickerMultiple() {
	const [ entries, setEntries ] = useState< Entry[] >( [] );
	const [ error, setError ] = useState( '' );
	const chooseRef = useRef< HTMLButtonElement >( null );
	const errorId = useId();
	const isFull = entries.length >= MAX_FILES;

	function addFiles( added: File[] ) {
		if ( ! added.length ) {
			return;
		}
		// Check each file, then keep only as many as the field has room for.
		const wrongType: File[] = [];
		const tooLarge: File[] = [];
		const accepted: File[] = [];
		for ( const file of added ) {
			if (
				! ACCEPTED_EXTENSIONS.includes(
					getExtension( file.name ).toLowerCase()
				)
			) {
				wrongType.push( file );
			} else if ( file.size > MAX_FILE_SIZE ) {
				tooLarge.push( file );
			} else {
				accepted.push( file );
			}
		}
		const overLimit = accepted.splice(
			Math.max( 0, MAX_FILES - entries.length )
		);

		// A file can be chosen twice, so give each entry its own key.
		const newEntries = accepted.map( ( file ) => ( {
			id: createId(),
			file,
			removeRef: createRef< HTMLButtonElement >(),
		} ) );
		setEntries( [ ...entries, ...newEntries ] );
		const names = ( files: File[] ) =>
			files.map( ( file ) => file.name ).join( ', ' );
		const messages = [];
		if ( wrongType.length ) {
			messages.push(
				`Couldn’t add ${ names( wrongType ) }. Choose PDF, JPEG, or PNG files.`
			);
		}
		if ( tooLarge.length ) {
			messages.push(
				`Couldn’t add ${ names( tooLarge ) }. Each file can be up to ${ formatFileSize( MAX_FILE_SIZE ) }.`
			);
		}
		if ( overLimit.length ) {
			messages.push(
				`Couldn’t add ${ names( overLimit ) }. You can add up to ${ MAX_FILES } files.`
			);
		}
		setError( messages.join( ' ' ) );
		if ( accepted.length ) {
			speak(
				accepted.length === 1
					? `${ accepted[ 0 ].name } added.`
					: `${ accepted.length } files added.`
			);
		}
	}

	function removeEntry( entry: Entry ) {
		const index = entries.indexOf( entry );
		const remaining = entries.filter( ( item ) => item !== entry );
		setEntries( remaining );
		setError( '' );
		speak( `${ entry.file.name } removed.` );
		// Move focus to the next file, or the previous one when the last file
		// was removed. Without files left, focus the button that adds them.
		const next = remaining[ index ] ?? remaining[ index - 1 ];
		( next ? next.removeRef.current : chooseRef.current )?.focus();
	}

	return (
		<Fieldset.Root
			// The drop target covers the whole field, so a file dropped on the
			// legend or description doesn't open in the browser tab.
			className={ styles[ 'drop-target' ] }
		>
			<Fieldset.Legend>Supporting documents</Fieldset.Legend>
			<Stack direction="column" gap="sm">
				{ entries.length > 0 && (
					<Stack
						render={ <ul /> }
						// Safari drops the list role when the markers are hidden.
						role="list"
						direction="column"
						gap="sm"
						className={ styles.list }
					>
						{ entries.map( ( entry ) => (
							<li key={ entry.id }>
								<SelectedFile
									ref={ entry.removeRef }
									file={ entry.file }
									onRemove={ () => removeEntry( entry ) }
								/>
							</li>
						) ) }
					</Stack>
				) }
				<FormFileUpload
					multiple
					accept={ ACCEPTED_EXTENSIONS.join( ',' ) }
					onChange={ ( { currentTarget } ) => {
						addFiles( Array.from( currentTarget.files ?? [] ) );
						currentTarget.value = '';
					} }
					render={ ( { openFileDialog } ) => (
						<Stack direction="row" className={ styles.surface }>
							<Button
								ref={ chooseRef }
								variant="unstyled"
								className={ styles.choose }
								disabled={ isFull }
								aria-describedby={ error ? errorId : undefined }
								onClick={ openFileDialog }
							>
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
										{ getPrompt( entries.length ) }
									</Text>
								</Stack>
							</Button>
						</Stack>
					) }
				/>
				<DropZone label="Drop to add files" onFilesDrop={ addFiles } />
			</Stack>
			<Fieldset.Description>
				{ `Drop up to ${ MAX_FILES } PDF, JPEG, or PNG files here, or choose them. Each file can be up to ${ formatFileSize( MAX_FILE_SIZE ) }.` }
			</Fieldset.Description>
			<FilePickerError id={ errorId } message={ error } />
		</Fieldset.Root>
	);
}
