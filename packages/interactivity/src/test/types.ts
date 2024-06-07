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

// Test types.
const n1: number = actions.sync();
n1;
const p1: Promise< number > = actions.async();
p1;
const n2: number = await actions.async();
n2;

// @ts-expect-error
const n3: string = actions.sync();
// @ts-expect-error
const p2: Promise< string > = actions.async();
// @ts-expect-error
const n4: string = await actions.async();
