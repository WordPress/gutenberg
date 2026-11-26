import { speak } from '@wordpress/a11y';
import { FormFileUpload } from '@wordpress/components';
import { useId, useRef, useState } from '@wordpress/element';
import { chevronDown, media, upload } from '@wordpress/icons';
import {
	Button,
	Dialog,
	Fieldset,
	Icon,
	Menu,
	Stack,
	ValidityIndicator,
} from '@wordpress/ui';
import { FileSummary, SelectedFile } from './selected-file';
import styles from './file-picker.module.css';
import previewStyles from './file-picker-preview.module.css';

function sampleImage( name: string, from: string, to: string ) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${ from }"/><stop offset="1" stop-color="${ to }"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/></svg>`;
	return new File( [ svg ], name, { type: 'image/svg+xml' } );
}

// Stand-ins for Media Library items, so the preview works without a site.
const LIBRARY = [
	sampleImage( 'harbor-at-dawn.svg', '#f6c28b', '#3d6c8c' ),
	sampleImage( 'forest-trail.svg', '#a7c957', '#1b4332' ),
	sampleImage( 'city-lights.svg', '#5a189a', '#ff9e00' ),
];

export function FilePickerMenu() {
	const [ file, setFile ] = useState< File >();
	const [ isLibraryOpen, setIsLibraryOpen ] = useState( false );
	const triggerRef = useRef< HTMLButtonElement >( null );
	const [ error, setError ] = useState( '' );
	const errorId = useId();

	function choose( chosen: File ) {
		// `accept` only filters the picker, so check the file.
		if ( ! chosen.type.startsWith( 'image/' ) ) {
			setError( `Couldn’t use ${ chosen.name }. Choose an image.` );
			return;
		}
		setFile( chosen );
		setError( '' );
		speak( `${ chosen.name } selected.` );
	}

	return (
		<Fieldset.Root>
			<Fieldset.Legend>Featured image</Fieldset.Legend>
			{ /*
			 * Wrap the whole menu, not the item: the item unmounts when the
			 * menu closes, and the input must stay mounted to report the
			 * selection.
			 */ }
			<FormFileUpload
				accept="image/*"
				onChange={ ( { currentTarget } ) => {
					const chosen = currentTarget.files?.[ 0 ];
					currentTarget.value = '';
					if ( chosen ) {
						choose( chosen );
					}
				} }
				render={ ( { openFileDialog } ) => (
					<Stack direction="column" gap="sm">
						<Menu.Root>
							<Menu.Trigger
								ref={ triggerRef }
								render={
									<Button
										variant="outline"
										tone="neutral"
										className={ styles.select }
										aria-describedby={
											error ? errorId : undefined
										}
									/>
								}
							>
								Select or add image
								<Icon icon={ chevronDown } />
							</Menu.Trigger>
							<Menu.Popup width="anchor">
								<Menu.Item
									prefix={
										<Menu.PrefixIcon icon={ media } />
									}
									onClick={ () => setIsLibraryOpen( true ) }
								>
									<Menu.ItemLabel>
										Open Media Library…
									</Menu.ItemLabel>
								</Menu.Item>
								<Menu.Item
									prefix={
										<Menu.PrefixIcon icon={ upload } />
									}
									onClick={ openFileDialog }
								>
									<Menu.ItemLabel>Upload…</Menu.ItemLabel>
								</Menu.Item>
							</Menu.Popup>
						</Menu.Root>
						{ file && (
							<SelectedFile
								file={ file }
								onRemove={ () => {
									speak( `${ file.name } removed.` );
									setFile( undefined );
									setError( '' );
									triggerRef.current?.focus();
								} }
							/>
						) }
					</Stack>
				) }
			/>
			<Fieldset.Description>
				Choose an image from the Media Library, or upload one.
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
			<Dialog.Root
				open={ isLibraryOpen }
				onOpenChange={ setIsLibraryOpen }
			>
				{ /* The menu item that opened the dialog is gone, so return focus to the menu's trigger. */ }
				<Dialog.Popup finalFocus={ triggerRef } size="small">
					<Dialog.Header>
						<Dialog.Title>Media Library</Dialog.Title>
						<Dialog.CloseIconButton />
					</Dialog.Header>
					<Dialog.Content>
						<Stack
							render={ <ul /> }
							direction="column"
							gap="sm"
							className={ styles.list }
						>
							{ LIBRARY.map( ( item ) => (
								<li key={ item.name }>
									<Button
										variant="unstyled"
										className={ `${ styles.choose } ${ previewStyles.option }` }
										onClick={ () => {
											choose( item );
											setIsLibraryOpen( false );
										} }
									>
										<FileSummary file={ item } />
									</Button>
								</li>
							) ) }
						</Stack>
					</Dialog.Content>
				</Dialog.Popup>
			</Dialog.Root>
		</Fieldset.Root>
	);
}
