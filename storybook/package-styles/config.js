/**
 * Internal dependencies
 */
import blockEditorLtr from '../package-styles/block-editor-ltr.lazy.scss?inline';
import blockEditorRtl from '../package-styles/block-editor-rtl.lazy.scss?inline';
import blockLibraryLtr from '../package-styles/block-library-ltr.lazy.scss?inline';
import blockLibraryRtl from '../package-styles/block-library-rtl.lazy.scss?inline';
import componentsLtr from '../package-styles/components-ltr.lazy.scss?inline';
import componentsRtl from '../package-styles/components-rtl.lazy.scss?inline';
import formatLibraryLtr from '../package-styles/format-library-ltr.lazy.scss?inline';
import formatLibraryRtl from '../package-styles/format-library-rtl.lazy.scss?inline';
import editSiteLtr from '../package-styles/edit-site-ltr.lazy.scss?inline';
import editSiteRtl from '../package-styles/edit-site-rtl.lazy.scss?inline';
import dataviewsLtr from '../package-styles/dataviews-ltr.lazy.scss?inline';
import dataviewsRtl from '../package-styles/dataviews-rtl.lazy.scss?inline';
import fieldsLtr from '../package-styles/fields-ltr.lazy.scss?inline';
import fieldsRtl from '../package-styles/fields-rtl.lazy.scss?inline';
import mediaFieldsLtr from '../package-styles/media-fields-ltr.lazy.scss?inline';
import mediaFieldsRtl from '../package-styles/media-fields-rtl.lazy.scss?inline';
import designTokens from '../package-styles/design-tokens.lazy.scss?inline';

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
		componentIdMatcher: /^dataviews-/,
		ltr: [ designTokens, componentsLtr, dataviewsLtr ],
		rtl: [ designTokens, componentsRtl, dataviewsRtl ],
	},
	{
		componentIdMatcher: /^fields-/,
		ltr: [ componentsLtr, dataviewsLtr, fieldsLtr, mediaFieldsLtr ],
		rtl: [ componentsRtl, dataviewsRtl, fieldsRtl, mediaFieldsRtl ],
	},
	{
		componentIdMatcher: /^design-system-/,
		ltr: [ designTokens ],
		rtl: [ designTokens ],
	},
	{
		componentIdMatcher: /^design-system-patterns-/,
		ltr: [ componentsLtr, dataviewsLtr ],
		rtl: [ componentsRtl, dataviewsRtl ],
	},
];

export default CONFIG;
