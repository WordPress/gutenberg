/**
 * Internal dependencies
 */
import blockEditorLtr from '../package-styles/block-editor-ltr.lazy.scss';
import blockEditorRtl from '../package-styles/block-editor-rtl.lazy.scss';
import blockLibraryLtr from '../package-styles/block-library-ltr.lazy.scss';
import blockLibraryRtl from '../package-styles/block-library-rtl.lazy.scss';
import componentsLtr from '../package-styles/components-ltr.lazy.scss';
import componentsRtl from '../package-styles/components-rtl.lazy.scss';
import formatLibraryLtr from '../package-styles/format-library-ltr.lazy.scss';
import formatLibraryRtl from '../package-styles/format-library-rtl.lazy.scss';
import editSiteLtr from '../package-styles/edit-site-ltr.lazy.scss';
import editSiteRtl from '../package-styles/edit-site-rtl.lazy.scss';
import dataviewsLtr from '../package-styles/dataviews-ltr.lazy.scss';
import dataviewsRtl from '../package-styles/dataviews-rtl.lazy.scss';

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
		ltr: [ dataviewsLtr, componentsLtr ],
		rtl: [ dataviewsRtl, componentsRtl ],
	},
];

export default CONFIG;
