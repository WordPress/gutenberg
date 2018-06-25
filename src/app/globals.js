/** @format */

import { createElement } from '@gutenberg/element';

global.wp = {
	element: {
		createElement, // load the element creation function, needed by Gutenberg-web
	},
};
