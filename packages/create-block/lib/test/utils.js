/**
 * Internal dependencies
 */
import {
	startCase,
	upperFirst,
} from '../utils';

describe( 'startCase', () => {
	test( 'words get converted to start with upper case', () => {
		expect(
			startCase( 'hello world' )
		).toBe(
			'Hello World'
		);
	} );
} );

describe( 'upperFirst', () => {
	test( 'First char gets converted to upper case', () => {
		expect(
			upperFirst( 'hello world' )
		).toBe(
			'Hello world'
		);
	} );
} );
