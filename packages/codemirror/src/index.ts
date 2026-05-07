import * as autocomplete from '@codemirror/autocomplete';
import * as commands from '@codemirror/commands';
import * as langCss from '@codemirror/lang-css';
import * as langHtml from '@codemirror/lang-html';
import * as language from '@codemirror/language';
import * as lint from '@codemirror/lint';
import * as search from '@codemirror/search';
import * as state from '@codemirror/state';
import * as view from '@codemirror/view';

/**
 * Private CodeMirror 6 surface bundled for WordPress core only.
 *
 * Not part of any public API. External consumers must depend on
 * `@codemirror/*` packages directly. The shape, contents, and existence
 * of this export may change without notice.
 */
export const __WORDPRESS_PRIVATE_DO_NOT_USE = {
	autocomplete,
	commands,
	langCss,
	langHtml,
	language,
	lint,
	search,
	state,
	view,
};
