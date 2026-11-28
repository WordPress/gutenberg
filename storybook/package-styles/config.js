import blockEditorLtr from '../../packages/block-editor/build-style/style.css?inline';
import blockEditorRtl from '../../packages/block-editor/build-style/style-rtl.css?inline';
import blockLibraryStyleLtr from '../../packages/block-library/build-style/style.css?inline';
import blockLibraryThemeLtr from '../../packages/block-library/build-style/theme.css?inline';
import blockLibraryEditorLtr from '../../packages/block-library/build-style/editor.css?inline';
import blockLibraryStyleRtl from '../../packages/block-library/build-style/style-rtl.css?inline';
import blockLibraryThemeRtl from '../../packages/block-library/build-style/theme-rtl.css?inline';
import blockLibraryEditorRtl from '../../packages/block-library/build-style/editor-rtl.css?inline';
import componentsLtr from '../../packages/components/build-style/style.css?inline';
import componentsRtl from '../../packages/components/build-style/style-rtl.css?inline';
import commandsLtr from '../../packages/commands/build-style/style.css?inline';
import commandsRtl from '../../packages/commands/build-style/style-rtl.css?inline';
import editorLtr from '../../packages/editor/build-style/style.css?inline';
import editorRtl from '../../packages/editor/build-style/style-rtl.css?inline';
import formatLibraryLtr from '../../packages/format-library/build-style/style.css?inline';
import formatLibraryRtl from '../../packages/format-library/build-style/style-rtl.css?inline';
import editSiteLtr from '../../packages/edit-site/build-style/style.css?inline';
import editSiteRtl from '../../packages/edit-site/build-style/style-rtl.css?inline';
import dataviewsLtr from '../../packages/dataviews/build-style/style.css?inline';
import dataviewsRtl from '../../packages/dataviews/build-style/style-rtl.css?inline';
import fieldsLtr from '../../packages/fields/build-style/style.css?inline';
import fieldsRtl from '../../packages/fields/build-style/style-rtl.css?inline';
import imageEditorLtr from '../../packages/image-editor/build-style/style.css?inline';
import imageEditorRtl from '../../packages/image-editor/build-style/style-rtl.css?inline';
import mediaEditorLtr from '../../packages/media-editor/build-style/style.css?inline';
import mediaEditorRtl from '../../packages/media-editor/build-style/style-rtl.css?inline';
import mediaFieldsLtr from '../../packages/media-fields/build-style/style.css?inline';
import mediaFieldsRtl from '../../packages/media-fields/build-style/style-rtl.css?inline';
import designTokens from '../package-styles/design-tokens.lazy.scss?inline';

const blockLibraryLtr = [
	blockLibraryStyleLtr,
	blockLibraryThemeLtr,
	blockLibraryEditorLtr,
].join( '\n' );
const blockLibraryRtl = [
	blockLibraryStyleRtl,
	blockLibraryThemeRtl,
	blockLibraryEditorRtl,
].join( '\n' );

/**
 * Stylesheets to lazy load when the story's context.componentId matches the
 * componentIdMatcher regex.
 *
 * To prevent problematically overscoped styles in a package stylesheet
 * from leaking into stories for other packages, we should explicitly declare
 * stylesheet dependencies for each story group.
 */
const CONFIG = [
	{
		componentIdMatcher: /.*/,
		ltr: [ designTokens ],
		rtl: [ designTokens ],
	},
	{
		componentIdMatcher: /^playground-/,
		ltr: [
			componentsLtr,
			blockEditorLtr,
			blockLibraryLtr,
			formatLibraryLtr,
		],
		rtl: [
			componentsRtl,
			blockEditorRtl,
			blockLibraryRtl,
			formatLibraryRtl,
		],
	},
	{
		componentIdMatcher: /^blockeditor-/,
		ltr: [ componentsLtr, blockEditorLtr ],
		rtl: [ componentsRtl, blockEditorRtl ],
	},
	{
		componentIdMatcher: /^editsite-/,
		ltr: [ componentsLtr, editSiteLtr ],
		rtl: [ componentsRtl, editSiteRtl ],
	},
	{
		componentIdMatcher: /^components-/,
		ltr: [ componentsLtr ],
		rtl: [ componentsRtl ],
	},
	{
		componentIdMatcher: /^editor-/,
		ltr: [ componentsLtr, editorLtr ],
		rtl: [ componentsRtl, editorRtl ],
	},
	{
		componentIdMatcher: /^icons-/,
		ltr: [ componentsLtr ],
		rtl: [ componentsRtl ],
	},
	{
		componentIdMatcher: /^dataviews-/,
		ltr: [ componentsLtr, dataviewsLtr ],
		rtl: [ componentsRtl, dataviewsRtl ],
	},
	{
		componentIdMatcher: /^fields-/,
		ltr: [ componentsLtr, dataviewsLtr, fieldsLtr, mediaFieldsLtr ],
		rtl: [ componentsRtl, dataviewsRtl, fieldsRtl, mediaFieldsRtl ],
	},
	{
		componentIdMatcher: /^admin-ui-/,
		ltr: [ componentsLtr ],
		rtl: [ componentsRtl ],
	},
	{
		// Dashboard stories include form controls and the command palette.
		componentIdMatcher: /^widget-dashboard-/,
		ltr: [ componentsLtr, commandsLtr, dataviewsLtr ],
		rtl: [ componentsRtl, commandsRtl, dataviewsRtl ],
	},
	{
		componentIdMatcher: /^image-editor-/,
		ltr: [ componentsLtr, imageEditorLtr ],
		rtl: [ componentsRtl, imageEditorRtl ],
	},
	{
		componentIdMatcher: /^mediaeditor-/,
		ltr: [ componentsLtr, mediaEditorLtr ],
		rtl: [ componentsRtl, mediaEditorRtl ],
	},
	{
		componentIdMatcher: /^design-system-patterns-/,
		ltr: [ componentsLtr, dataviewsLtr ],
		rtl: [ componentsRtl, dataviewsRtl ],
	},
	{
		componentIdMatcher: /^widget-primitives-/,
		ltr: [ componentsLtr, dataviewsLtr ],
		rtl: [ componentsRtl, dataviewsRtl ],
	},
];

export default CONFIG;
