/** @format */

import { createElement } from '@wordpress/element';

global.wp = {
	element: {
		createElement, // load the element creation function, needed by Gutenberg-web
	},
};
