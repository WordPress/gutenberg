/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { PATTERN_DEFAULT_CATEGORY, PATTERN_TYPES } from '../../utils/constants';
import Page from '../page';
import PatternsList from './patterns-list';
import usePatternSettings from './use-pattern-settings';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

export default function PagePatterns() {
	const { categoryType, categoryId } = getQueryArgs( window.location.href );
	const type = categoryType || PATTERN_TYPES.theme;
	const category = categoryId || PATTERN_DEFAULT_CATEGORY;
	const settings = usePatternSettings();

	// Wrap everything in a block editor provider.
	// This ensures 'styles' that are needed for the previews are synced
	// from the site editor store to the block editor store.
	return (
		<ExperimentalBlockEditorProvider settings={ settings }>
			<Page
				className="edit-site-patterns"
				title={ __( 'Patterns content' ) }
				hideTitleFromUI
			>
				<PatternsList
					// Reset the states when switching between categories and types.
					key={ `${ type }-${ category }` }
					type={ type }
					categoryId={ category }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
