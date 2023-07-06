/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { DEFAULT_CATEGORY, DEFAULT_TYPE } from './utils';
import Page from '../page';
import PatternsList from './patterns-list';
import usePatternSettings from './use-pattern-settings';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

export default function PagePatterns() {
	const { categoryType, categoryId } = getQueryArgs( window.location.href );
	const type = categoryType || DEFAULT_TYPE;
	const category = categoryId || DEFAULT_CATEGORY;
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
				<PatternsList type={ type } categoryId={ category } />
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
