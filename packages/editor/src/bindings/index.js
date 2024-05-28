/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import patternOverrides from './pattern-overrides';
import postMeta from './post-meta';

const { registerBlockBindingsSource } = unlock( dispatch( blocksStore ) );
registerBlockBindingsSource( postMeta );
registerBlockBindingsSource( patternOverrides );
