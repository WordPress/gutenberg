/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import patternOverrides from './pattern-overrides';
import postMeta from './post-meta';
import entity from './post-entity';

const { registerBlockBindingsSource } = unlock( dispatch( blockEditorStore ) );
registerBlockBindingsSource( patternOverrides );
registerBlockBindingsSource( postMeta );
registerBlockBindingsSource( entity );
