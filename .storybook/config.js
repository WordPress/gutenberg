import { configure } from '@storybook/react';
import * as element from 'element';
import './style.scss';

function loadStories() {
	window.wp = { ...window.wp, element };
	require( '../components/story' );
	require( '../components/button/story' );
}

configure( loadStories, module );
