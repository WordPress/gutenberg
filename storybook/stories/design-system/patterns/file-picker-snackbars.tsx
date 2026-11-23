import { SnackbarList } from '@wordpress/components';
import { useState } from '@wordpress/element';
import styles from './file-picker.module.css';

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
		setNotices( [ { id: crypto.randomUUID(), content } ] );
	}

	const list = (
		<SnackbarList
			className={ styles.snackbars }
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
	const [ data ] = await Promise.all( [
		file.text().then( ( text ) => {
			try {
				return JSON.parse( text );
			} catch {
				return null;
			}
		} ),
		new Promise( ( resolve ) => setTimeout( resolve, 1500 ) ),
	] );
	if ( typeof data?.title !== 'string' ) {
		throw new Error( `${ file.name } isn’t a pattern file.` );
	}
	return data.title as string;
}
