/**
 * Internal dependencies
 */
import { hidePdfEmbedsOnUnsupportedBrowsers } from './utils';

document.addEventListener(
	'DOMContentLoaded',
	hidePdfEmbedsOnUnsupportedBrowsers
);
