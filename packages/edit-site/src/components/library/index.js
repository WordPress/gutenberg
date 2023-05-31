/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
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
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

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

	const settings = useSelect(
		( select ) => select( editSiteStore ).getSettings(),
		[]
	);

	// If we only have a single region, due to not including a header on this page,
	// do we need the aria-label section?
	const regionLabels = { body: __( 'Library - Content' ) };

	return (
		<InterfaceSkeleton
			className="edit-site-library"
			labels={ regionLabels }
			notices={ <EditorSnackbars /> }
			content={
				// Wrap everything in a block editor provider.
				// This ensures 'styles' that are needed for the previews are synced
				// from the site editor store to the block editor store.
				<ExperimentalBlockEditorProvider settings={ settings }>
					<Grid
						type={ type }
						category={ category }
						label={ __( 'Patterns list' ) }
					/>
				</ExperimentalBlockEditorProvider>
			}
			shortcuts={ {
				previous: previousShortcut,
				next: nextShortcut,
			} }
		/>
	);
}
