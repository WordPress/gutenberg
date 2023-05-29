/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { EditorSnackbars } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { InterfaceSkeleton } from '@wordpress/interface';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Grid from './grid';
import useTitle from '../routes/use-title';

const DEFAULT_TYPE = 'wp_template_part';
const DEFAULT_CATEGORY = 'header';

export default function Library() {
	const { categoryType, categoryName } = getQueryArgs( window.location.href );
	const type = categoryType || DEFAULT_TYPE;
	const category = categoryName || DEFAULT_CATEGORY;

	// Do we need shortcuts if we aren't displaying a header?
	const { previousShortcut, nextShortcut } = useSelect( ( select ) => {
		return {
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/previous-region' ),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/next-region' ),
		};
	}, [] );

	useTitle( __( 'Library' ) );

	// If we only have a single region, due to not including a header on this page,
	// do we need the aria-label section?
	const regionLabels = { body: __( 'Library - Content' ) };

	return (
		<InterfaceSkeleton
			className="edit-site-library"
			labels={ regionLabels }
			notices={ <EditorSnackbars /> }
			content={ <Grid type={ type } category={ category } /> }
			shortcuts={ {
				previous: previousShortcut,
				next: nextShortcut,
			} }
		/>
	);
}
