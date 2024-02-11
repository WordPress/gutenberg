/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import postMeta from './post-meta';

const { registerBlockBindingsSource } = unlock( dispatch( blockEditorStore ) );
registerBlockBindingsSource( postMeta );
