import { SnackbarList } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { createId } from './selected-file';
import previewStyles from './file-picker-preview.module.css';

/*
 * Helpers for the preview only: a snackbar list and a stand-in for the
 * request that imports a pattern.
 */

/**
 * A local snackbar list, so the preview is self-contained. In a WordPress
 * screen, create the notice with `core/notices` and `type: 'snackbar'`, and
 * the screen's existing snackbar region shows it.
 */
export function useSnackbars() {
	const [ notices, setNotices ] = useState<
		Array< { id: string; content: string } >
	>( [] );
	function show( content: string ) {
		// A new id makes the list show the snackbar again for a repeat.
		setNotices( [ { id: createId(), content } ] );
	}

	const list = (
		<SnackbarList
			className={ previewStyles.snackbars }
			notices={ notices }
			onRemove={ ( id ) =>
				setNotices( ( current ) =>
					current.filter( ( notice ) => notice.id !== id )
				)
			}
		/>
	);

	// Hide an earlier confirmation, so it isn't read as the latest result.
	function hide() {
		setNotices( [] );
	}

	return { show, hide, list };
}

/**
 * Reads a pattern exported as JSON and returns its title, after a delay that
 * stands in for the request that would save it.
 *
 * @param file The chosen file.
 */
export async function importPattern( file: File ) {
	const [ text ] = await Promise.all( [
		file.text(),
		new Promise( ( resolve ) => setTimeout( resolve, 1500 ) ),
	] );
	// `JSON.parse()` throws for a file that isn't JSON. Then check the fields
	// like the Patterns screen does before it saves a pattern.
	const data = JSON.parse( text );
	if (
		data?.__file !== 'wp_block' ||
		typeof data.title !== 'string' ||
		typeof data.content !== 'string' ||
		! data.title ||
		! data.content ||
		( data.syncStatus && typeof data.syncStatus !== 'string' )
	) {
		throw new Error( 'Not a pattern file.' );
	}
	return data.title as string;
}
