import { speak } from '@wordpress/a11y';
import { DropZone, FormFileUpload } from '@wordpress/components';
import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import {
	Badge,
	Button,
	Fieldset,
	Icon,
	Progress,
	Stack,
	Text,
	ValidityIndicator,
} from '@wordpress/ui';
import { createId, getExtension, SelectedFile } from './selected-file';
import styles from './file-picker.module.css';

type Upload = {
	id: string;
	file: File;
	status: 'uploading' | 'uploaded' | 'failed';
	progress: number;
	attempt: number;
};

/**
 * Uploads each chosen file and shows its progress in its row.
 *
 * The upload is simulated. The first attempt to upload a PDF fails, so the
 * "Retry" button can be tried.
 */
export function FilePickerUpload() {
	const [ uploads, setUploads ] = useState< Upload[] >( [] );
	const timers = useRef( new Map< string, number >() );
	const removeRefs = useRef( new Map< string, HTMLButtonElement >() );
	const chooseRef = useRef< HTMLButtonElement >( null );
	const announcements = useRef< string[] >( [] );
	const announceTimerRef = useRef< number >( undefined );
	const [ error, setError ] = useState( '' );
	const errorId = useId();

	useEffect( () => {
		const current = timers.current;
		return () => {
			current.forEach( ( timer ) => clearInterval( timer ) );
			clearTimeout( announceTimerRef.current );
		};
	}, [] );

	/*
	 * Uploads added together finish together, and each `speak()` call
	 * replaces the previous message. Collect the messages of one moment and
	 * announce them at once, in order, so the latest action is read last.
	 */
	function announce( message: string ) {
		announcements.current.push( message );
		if ( announcements.current.length === 1 ) {
			announceTimerRef.current = window.setTimeout(
				() => speak( announcements.current.splice( 0 ).join( ' ' ) ),
				100
			);
		}
	}

	function update( id: string, changes: Partial< Upload > ) {
		setUploads( ( current ) =>
			current.map( ( upload ) =>
				upload.id === id ? { ...upload, ...changes } : upload
			)
		);
	}

	function stop( id: string ) {
		clearInterval( timers.current.get( id ) );
		timers.current.delete( id );
	}

	function start( id: string, file: File, attempt: number ) {
		let progress = 0;
		const fails =
			attempt === 1 && getExtension( file.name ).toLowerCase() === '.pdf';
		const timer = window.setInterval( () => {
			progress += 20;
			if ( fails && progress >= 60 ) {
				stop( id );
				update( id, { status: 'failed' } );
				announce(
					`Couldn’t upload ${ file.name }. Select “Retry” to try again.`
				);
			} else if ( progress >= 100 ) {
				stop( id );
				update( id, { status: 'uploaded', progress } );
				announce( `${ file.name } uploaded.` );
			} else {
				update( id, { progress } );
			}
		}, 400 );
		timers.current.set( id, timer );
	}

	function addFiles( files: File[] ) {
		// `accept` only filters the picker, so check dropped files too.
		const isAccepted = ( file: File ) =>
			file.type.startsWith( 'image/' ) ||
			getExtension( file.name ).toLowerCase() === '.pdf';
		const rejected = files.filter( ( file ) => ! isAccepted( file ) );
		setError(
			rejected.length
				? `Couldn’t add ${ rejected
						.map( ( file ) => file.name )
						.join( ', ' ) }. Choose images or PDF files.`
				: ''
		);
		const added = files.filter( isAccepted ).map( ( file ) => ( {
			id: createId(),
			file,
			status: 'uploading' as const,
			progress: 0,
			attempt: 1,
		} ) );
		setUploads( ( current ) => [ ...current, ...added ] );
		added.forEach( ( { id, file } ) => start( id, file, 1 ) );
		if ( added.length ) {
			announce(
				added.length === 1
					? `Uploading ${ added[ 0 ].file.name }.`
					: `Uploading ${ added.length } files.`
			);
		}
	}

	function retry( upload: Upload ) {
		update( upload.id, {
			status: 'uploading',
			progress: 0,
			attempt: upload.attempt + 1,
		} );
		start( upload.id, upload.file, upload.attempt + 1 );
		// The "Retry" button is about to go, so move focus to the row's
		// remove button, which now cancels the upload. Its new name may not
		// be read while it has focus, so say what happens.
		removeRefs.current.get( upload.id )?.focus();
		announce( `Uploading ${ upload.file.name } again.` );
	}

	function remove( upload: Upload ) {
		stop( upload.id );
		const index = uploads.indexOf( upload );
		const remaining = uploads.filter( ( item ) => item !== upload );
		// A timer may have updated the list since this render, so filter the
		// latest state.
		setUploads( ( current ) =>
			current.filter( ( item ) => item.id !== upload.id )
		);
		announce(
			upload.status === 'uploading'
				? `Upload of ${ upload.file.name } canceled.`
				: `${ upload.file.name } removed.`
		);
		const next = remaining[ index ] ?? remaining[ index - 1 ];
		( next
			? removeRefs.current.get( next.id )
			: chooseRef.current
		)?.focus();
	}

	const status = {
		uploading: undefined,
		// A finished upload is the normal state, so it doesn't draw the eye. A
		// failed one needs action, so it does.
		uploaded: 'Uploaded',
		failed: <Badge intent="high">Couldn’t upload</Badge>,
	};

	return (
		<Fieldset.Root
			// The drop target covers the whole field, so a file dropped on the
			// legend or description doesn't open in the browser tab.
			className={ styles[ 'drop-target' ] }
		>
			<Fieldset.Legend>Photos of the damage</Fieldset.Legend>
			<Stack direction="column" gap="sm">
				{ uploads.length > 0 && (
					<Stack
						render={ <ul /> }
						direction="column"
						gap="sm"
						// Safari drops the list role when the markers are hidden.
						role="list"
						className={ styles.list }
					>
						{ uploads.map( ( upload ) => (
							<li key={ upload.id }>
								<SelectedFile
									ref={ ( element ) => {
										if ( element ) {
											removeRefs.current.set(
												upload.id,
												element
											);
										} else {
											removeRefs.current.delete(
												upload.id
											);
										}
									} }
									file={ upload.file }
									status={ status[ upload.status ] }
									// A failed row shows only its status, so the
									// failure stands out.
									showDetails={ upload.status !== 'failed' }
									removeLabel={
										upload.status === 'uploading'
											? `Cancel upload of ${ upload.file.name }`
											: undefined
									}
									progress={
										upload.status === 'uploading' && (
											<Progress.Root
												className={ styles.progress }
												value={ upload.progress }
												aria-label={ `Uploading ${ upload.file.name }` }
											>
												<Progress.Track>
													<Progress.Indicator />
												</Progress.Track>
											</Progress.Root>
										)
									}
									actions={
										upload.status === 'failed' && (
											<Button
												variant="minimal"
												tone="neutral"
												size="small"
												aria-label={ `Retry uploading ${ upload.file.name }` }
												onClick={ () =>
													retry( upload )
												}
											>
												Retry
											</Button>
										)
									}
									onRemove={ () => remove( upload ) }
								/>
							</li>
						) ) }
					</Stack>
				) }
				<FormFileUpload
					multiple
					accept="image/*,.pdf"
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
									gap="sm"
								>
									<span className={ styles.thumbnail }>
										<Icon icon={ plus } />
									</span>
									<Text className={ styles.prompt }>
										{ uploads.length
											? 'Add more files'
											: 'Add files' }
									</Text>
								</Stack>
							</Button>
						</Stack>
					) }
				/>
				<DropZone label="Drop to upload" onFilesDrop={ addFiles } />
			</Stack>
			<Fieldset.Description>
				Drop photos or PDFs here, or choose them. Each file uploads as
				soon as you add it.
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
	);
}
