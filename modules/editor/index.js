/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import './blocks';
import Editor from './editor';

/**
 * Editor instances keyed by ID.
 *
 * @type {Object}
 */
const editors = {};

/**
 * Returns an instance of Editor.
 *
 * @param  {String}    id Unique identifier for editor instance
 * @return {wp.Editor}    Editor instance
 */
export function getEditorInstance( id ) {
	return editors[ id ];
}

/**
 * Initializes and returns an instance of Editor.
 *
 * @param  {String}    id       Unique identifier for editor instance
 * @param  {Object}    settings [description]
 * @return {wp.Editor}          Editor instance
 */
export function createEditorInstance( id, settings ) {
	editors[ id ] = new Editor( id, settings );
	return getEditorInstance( id );
}
