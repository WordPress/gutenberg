import { configure } from '@storybook/react';
import * as element from 'element';

function loadStories() {
	console.log( 'aloooooo' );
	window.wp = { ...window.wp, element };
  require( '../components/story' );
  require( '../components/button/story' );
}

configure( loadStories, module );
