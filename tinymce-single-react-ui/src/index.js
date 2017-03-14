/**
 * External dependencies
 */
import '../../shared/post-content';
import { render } from 'react-dom';
import { createElement, Component } from 'react';
import TinyMCEReactUI from 'tinymce-react/tinymce-react-ui';

render(
	<div>
		<hr />
		<TinyMCEReactUI content={window.content}/>
		<hr />
		<br/>
	</div>,
	document.getElementById('tiny-react')
);

