/**
 * WordPress dependencies
 */
import { store as bindingsStore } from '@wordpress/bindings';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import patternOverrides from './pattern-overrides';
import postMeta from './post-meta';
import postEntity from './post-entity';

const { registerBindingsSource } = unlock( dispatch( bindingsStore ) );

registerBindingsSource( postMeta );
registerBindingsSource( postEntity );

if ( process.env.IS_GUTENBERG_PLUGIN ) {
	registerBindingsSource( patternOverrides );
}
