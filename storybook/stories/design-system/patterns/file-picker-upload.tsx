import { speak } from '@wordpress/a11y';
import { DropZone, FormFileUpload } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import { Button, Fieldset, Icon, Progress, Stack, Text } from '@wordpress/ui';
import { getExtension, SelectedFile } from './selected-file';
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

	useEffect( () => {
		const current = timers.current;
		return () => current.forEach( ( timer ) => clearInterval( timer ) );
	}, [] );

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
				speak( `Couldn’t upload ${ file.name }.` );
			} else if ( progress >= 100 ) {
				stop( id );
				update( id, { status: 'uploaded', progress } );
				speak( `${ file.name } uploaded.` );
			} else {
				update( id, { progress } );
			}
		}, 400 );
		timers.current.set( id, timer );
	}

	function addFiles( files: File[] ) {
		const added = files.map( ( file ) => ( {
			id: crypto.randomUUID(),
			file,
			status: 'uploading' as const,
			progress: 0,
			attempt: 1,
		} ) );
		setUploads( ( current ) => [ ...current, ...added ] );
		added.forEach( ( { id, file } ) => start( id, file, 1 ) );
	}

	function retry( upload: Upload ) {
		update( upload.id, {
			status: 'uploading',
			progress: 0,
			attempt: upload.attempt + 1,
		} );
		start( upload.id, upload.file, upload.attempt + 1 );
	}

	function remove( upload: Upload ) {
		stop( upload.id );
		const index = uploads.indexOf( upload );
		const remaining = uploads.filter( ( item ) => item !== upload );
		setUploads( remaining );
		speak(
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
		uploading: 'Uploading',
		uploaded: <span className={ styles.success }>Uploaded</span>,
		failed: <span className={ styles.error }>Couldn’t upload</span>,
	};

	return (
		<Fieldset.Root>
			<Fieldset.Legend>Photos of the damage</Fieldset.Legend>
			<Stack
				direction="column"
				gap="sm"
				className={ styles[ 'drop-target' ] }
			>
				{ uploads.length > 0 && (
					<Stack
						render={ <ul /> }
						direction="column"
						gap="sm"
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
									removeLabel={
										upload.status === 'uploading'
											? `Cancel upload of ${ upload.file.name }`
											: undefined
									}
									footer={
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
												size="compact"
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
		</Fieldset.Root>
	);
}
