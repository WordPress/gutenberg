import { speak } from '@wordpress/a11y';
import { DropZone, FormFileUpload } from '@wordpress/components';
import { useId, useRef, useState } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import {
	Button,
	Fieldset,
	Icon,
	Stack,
	Text,
	ValidityIndicator,
} from '@wordpress/ui';
import { getExtension, SelectedFile } from './selected-file';
import styles from './file-picker.module.css';

const ACCEPTED_EXTENSIONS = [ '.pdf', '.jpg', '.jpeg', '.png' ];

type Entry = { id: number; file: File };

export function FilePickerMultiple() {
	const [ entries, setEntries ] = useState< Entry[] >( [] );
	const [ error, setError ] = useState( '' );
	const chooseRef = useRef< HTMLButtonElement >( null );
	const removeRefs = useRef( new Map< number, HTMLButtonElement >() );
	const nextId = useRef( 0 );
	const errorId = useId();

	function addFiles( added: File[] ) {
		if ( ! added.length ) {
			return;
		}
		const accepted = added.filter( ( file ) =>
			ACCEPTED_EXTENSIONS.includes(
				getExtension( file.name ).toLowerCase()
			)
		);
		const rejected = added.filter(
			( file ) => ! accepted.includes( file )
		);

		// A file can be chosen twice, so give each entry its own key.
		const newEntries = accepted.map( ( file ) => ( {
			id: nextId.current++,
			file,
		} ) );
		setEntries( ( current ) => [ ...current, ...newEntries ] );
		setError(
			rejected.length
				? `Couldn’t add ${ rejected
						.map( ( file ) => file.name )
						.join( ', ' ) }. Choose PDF, JPEG, or PNG files.`
				: ''
		);
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
		( next
			? removeRefs.current.get( next.id )
			: chooseRef.current
		)?.focus();
	}

	return (
		<Fieldset.Root>
			<Fieldset.Legend>Supporting documents</Fieldset.Legend>
			<Stack
				direction="column"
				gap="sm"
				className={ styles[ 'drop-target' ] }
			>
				{ entries.length > 0 && (
					<Stack
						render={ <ul /> }
						direction="column"
						gap="sm"
						className={ styles.list }
					>
						{ entries.map( ( entry ) => (
							<li key={ entry.id }>
								<SelectedFile
									ref={ ( element ) => {
										if ( element ) {
											removeRefs.current.set(
												entry.id,
												element
											);
										} else {
											removeRefs.current.delete(
												entry.id
											);
										}
									} }
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
								aria-describedby={ error ? errorId : undefined }
								onClick={ openFileDialog }
							>
								<Stack
									render={ <span /> }
									direction="row"
									align="center"
									gap="md"
								>
									<span className={ styles.thumbnail }>
										<Icon icon={ plus } />
									</span>
									<Text className={ styles.prompt }>
										{ entries.length
											? 'Add more files'
											: 'Add files' }
									</Text>
								</Stack>
							</Button>
						</Stack>
					) }
				/>
				<DropZone label="Drop to add files" onFilesDrop={ addFiles } />
			</Stack>
			<Fieldset.Description>
				Drop PDF, JPEG, or PNG files here, or choose them.
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
