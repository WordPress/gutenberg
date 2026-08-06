import { Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import {
	store as patternsStore,
	// @ts-expect-error - No type declarations available for @wordpress/patterns
} from '@wordpress/patterns';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Header trigger for importing a pattern from a JSON file, offered next to
 * the primary create button.
 *
 * The file reading, validation and pattern creation live in the patterns
 * store action, shared with the classic site editor, so the two imports
 * cannot drift apart.
 */
export default function ImportPatternButton() {
	const inputRef = useRef< HTMLInputElement >( null );
	const { createPatternFromFile } = unlock( useDispatch( patternsStore ) );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	return (
		<>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () => inputRef.current?.click() }
			>
				{ __( 'Import pattern from JSON' ) }
			</Button>
			<input
				type="file"
				accept=".json"
				hidden
				ref={ inputRef }
				onChange={ async ( event ) => {
					const file = event.target.files?.[ 0 ];
					if ( ! file ) {
						return;
					}
					try {
						const pattern = await createPatternFromFile( file );
						createSuccessNotice(
							sprintf(
								// translators: %s: The imported pattern's title.
								__( 'Imported "%s" from JSON.' ),
								pattern.title.raw
							),
							{
								type: 'snackbar',
								id: 'import-pattern-success',
							}
						);
					} catch ( err ) {
						createErrorNotice( ( err as Error ).message, {
							type: 'snackbar',
							id: 'import-pattern-error',
						} );
					} finally {
						// Allow the same file to be picked again.
						event.target.value = '';
					}
				} }
			/>
		</>
	);
}
