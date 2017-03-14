/**
 * External dependencies
 */
import '../../shared/post-content';

import React, { createElement, Component } from 'react';
import { render } from 'react-dom';
import Toolbar from './components/toolbar/Toolbar'
import TinyMCEReactUI from 'tinymce-react/tinymce-react-ui';

render(
	<div>
		<Toolbar />
		<TinyMCEReactUI content={window.content} />
		<hr />
		<br />
	</div>,
	document.getElementById('tiny-react')
);

