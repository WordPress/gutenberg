// Bootstrap server-registered blocks
// eslint-disable-next-line camelcase
import { unstable__bootstrapServerSideBlockDefinitions } from '@wordpress/blocks';

unstable__bootstrapServerSideBlockDefinitions(
	require( 'core-blocks/test/server-registered.json' )
);
