/**
 * External dependencies
 */
import 'prismjs';
import { configure, setAddon } from '@storybook/react';
import infoAddon from '@storybook/addon-info';

/**
 * Internal dependencies
 */
import * as element from 'element';
import './style.scss';

function loadStories() {
	window.wp = { ...window.wp, element };
	require( '../components/story' );
	require( '../components/button/story' );
}

setAddon(infoAddon);

configure( loadStories, module );
