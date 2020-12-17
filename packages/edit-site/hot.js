/**
 * Internal dependencies
 */
import { initialize } from './src/index';
import './src/style.scss';

window.wp.domReady( () =>
	initialize( 'edit-site-editor', window.wp.editorSettings )
);
