/**
 * Internal dependencies
 */
import blockEditorLtr from '../package-styles/block-editor-ltr.lazy.scss?raw';
import blockEditorRtl from '../package-styles/block-editor-rtl.lazy.scss?raw';
import blockLibraryLtr from '../package-styles/block-library-ltr.lazy.scss?raw';
import blockLibraryRtl from '../package-styles/block-library-rtl.lazy.scss?raw';
import componentsLtr from '../package-styles/components-ltr.lazy.scss?raw';
import componentsRtl from '../package-styles/components-rtl.lazy.scss?raw';
import formatLibraryLtr from '../package-styles/format-library-ltr.lazy.scss?raw';
import formatLibraryRtl from '../package-styles/format-library-rtl.lazy.scss?raw';
import editSiteLtr from '../package-styles/edit-site-ltr.lazy.scss?raw';
import editSiteRtl from '../package-styles/edit-site-rtl.lazy.scss?raw';
import dataviewsLtr from '../package-styles/dataviews-ltr.lazy.scss?raw';
import dataviewsRtl from '../package-styles/dataviews-rtl.lazy.scss?raw';
import fieldsLtr from '../package-styles/fields-ltr.lazy.scss?raw';
import fieldsRtl from '../package-styles/fields-rtl.lazy.scss?raw';
import mediaFieldsLtr from '../package-styles/media-fields-ltr.lazy.scss?raw';
import mediaFieldsRtl from '../package-styles/media-fields-rtl.lazy.scss?raw';
import ui from '../package-styles/ui.lazy.scss?raw';

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
		ltr: [ componentsLtr, dataviewsLtr ],
		rtl: [ componentsRtl, dataviewsRtl ],
	},
	{
		componentIdMatcher: /^fields-/,
		ltr: [ componentsLtr, dataviewsLtr, fieldsLtr, mediaFieldsLtr ],
		rtl: [ componentsRtl, dataviewsRtl, fieldsRtl, mediaFieldsRtl ],
	},
	{
		componentIdMatcher: /^design-system-components-/,
		ltr: [ ui ],
		rtl: [ ui ],
	},
];

export default CONFIG;
