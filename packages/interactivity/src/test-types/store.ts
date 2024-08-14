/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Internal dependencies
 */
import { store } from '../store';

const { actions } = store( 'test', {
	actions: {
		sync: () => 123,
		*async() {
			return 123;
		},
	},
} );

/**
 * Test types.
 */
{
	const var1: number = actions.sync();
	const var2: Promise< number > = actions.async();
	const var3: number = await actions.async();
}

{
	// @ts-expect-error
	const var1: string = actions.sync();
	// @ts-expect-error
	const var2: Promise< string > = actions.async();
	// @ts-expect-error
	const var3: string = await actions.async();
}
