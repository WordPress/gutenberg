import type { RefObject } from 'react';
import { speak } from '@wordpress/a11y';
import { DropZone, FormFileUpload } from '@wordpress/components';
import { createRef, useId, useRef, useState } from '@wordpress/element';
import { upload } from '@wordpress/icons';
import {
	Button,
	Card,
	EmptyState,
	Stack,
	Text,
	ValidityIndicator,
} from '@wordpress/ui';
import { createId, getExtension, SelectedFile } from './selected-file';
import styles from './file-picker.module.css';

const FONT_EXTENSIONS = [ '.ttf', '.otf', '.woff', '.woff2' ];

type Entry = {
	id: string;
	file: File;
	/** The row's remove button, so focus can move to it after a removal. */
	removeRef: RefObject< HTMLButtonElement | null >;
};

export function FilePickerPanel() {
	const [ entries, setEntries ] = useState< Entry[] >( [] );
	const [ error, setError ] = useState( '' );
	const chooseRef = useRef< HTMLButtonElement >( null );
	const errorId = useId();

	function addFiles( files: File[] ) {
		const isFont = ( file: File ) =>
			FONT_EXTENSIONS.includes( getExtension( file.name ).toLowerCase() );
		const fonts = files.filter( isFont );
		const rejected = files.filter( ( file ) => ! isFont( file ) );
		setEntries( ( current ) => [
			...current,
			...fonts.map( ( file ) => ( {
				id: createId(),
				file,
				removeRef: createRef< HTMLButtonElement >(),
			} ) ),
		] );
		setError(
			rejected.length
				? `Couldn’t add ${ rejected
						.map( ( file ) => file.name )
						.join(
							', '
						) }. Choose .ttf, .otf, .woff, or .woff2 files.`
				: ''
		);
		if ( fonts.length ) {
			speak(
				fonts.length === 1
					? `${ fonts[ 0 ].name } added.`
					: `${ fonts.length } fonts added.`
			);
		}
	}

	function removeEntry( entry: Entry ) {
		const index = entries.indexOf( entry );
		const remaining = entries.filter( ( item ) => item !== entry );
		setEntries( remaining );
		setError( '' );
		speak( `${ entry.file.name } removed.` );
		const next = remaining[ index ] ?? remaining[ index - 1 ];
		( next ? next.removeRef.current : chooseRef.current )?.focus();
	}

	return (
		<Card.Root className={ styles[ 'drop-target' ] }>
			<Card.Header>
				<Stack
					direction="row"
					align="center"
					justify="space-between"
					gap="sm"
				>
					<Card.Title render={ <h3 /> }>Fonts</Card.Title>
					{ /*
					 * The button stays in the header, so it keeps focus when
					 * the empty state gives way to the list.
					 */ }
					<FormFileUpload
						multiple
						accept={ FONT_EXTENSIONS.join( ',' ) }
						onChange={ ( { currentTarget } ) => {
							addFiles( Array.from( currentTarget.files ?? [] ) );
							currentTarget.value = '';
						} }
						render={ ( { openFileDialog } ) => (
							<Button
								ref={ chooseRef }
								variant="outline"
								tone="neutral"
								aria-describedby={ error ? errorId : undefined }
								onClick={ openFileDialog }
							>
								Choose files…
							</Button>
						) }
					/>
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					{ entries.length > 0 ? (
						<>
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
											onRemove={ () =>
												removeEntry( entry )
											}
										/>
									</li>
								) ) }
							</Stack>
							<Text variant="body-sm" className={ styles.weak }>
								Drop more font files anywhere in this panel.
							</Text>
						</>
					) : (
						// `EmptyState` limits its own width, so center it in the
						// panel.
						<Stack direction="column" align="center">
							<EmptyState.Root>
								<EmptyState.Icon icon={ upload } />
								<EmptyState.Title render={ <h4 /> }>
									Upload fonts
								</EmptyState.Title>
								<EmptyState.Description>
									Drop font files anywhere in this panel, or
									choose them. Supported formats: .ttf, .otf,
									.woff, and .woff2.
								</EmptyState.Description>
							</EmptyState.Root>
						</Stack>
					) }
					<div aria-live="polite" className={ styles.error }>
						{ error && (
							<ValidityIndicator
								id={ errorId }
								type="invalid"
								message={ error }
							/>
						) }
					</div>
				</Stack>
				{ /* Its overlay covers the card, the nearest positioned ancestor. */ }
				<DropZone label="Drop to add fonts" onFilesDrop={ addFiles } />
			</Card.Content>
		</Card.Root>
	);
}
