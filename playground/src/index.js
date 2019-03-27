/**
 * External dependencies
 */
import '@babel/polyfill';

/**
 * WordPress dependencies
 */
import { render, Fragment, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import Menu from './components/menu';
import Editor from './components/editor';
import Storybook from './components/storybook';

function Playground() {
	const [ page, updatePage ] = useState( 'editor' );
	return (
		<Fragment>
			<div className="playground__header">
				<h1 className="playground__logo">Gutenberg Playground</h1>
				<div className="playground__menu">
					<Menu page={ page } onNavigate={ updatePage } />
				</div>
			</div>
			<div className="playground__body">
				{ page === 'editor' && <Editor /> }
				{ page === 'components' && <Storybook /> }
			</div>
		</Fragment>
	);
}

render(
	<Playground />,
	document.querySelector( '#app' )
);
