/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import { toVdom } from '../vdom';

describe( 'Unique IDs in directives', () => {
	let container: HTMLDivElement;

	beforeEach( () => {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
	} );

	afterEach( () => {
		document.body.removeChild( container );
	} );

	test( 'should parse directive with unique ID', () => {
		container.innerHTML = `
			<div data-wp-context---unique='{"prop": "value"}'>
				<span>Test</span>
			</div>
		`;

		const vdom = toVdom( container.firstElementChild as HTMLElement );

		expect( vdom.props.__directives ).toBeDefined();
		expect( vdom.props.__directives.context ).toHaveLength( 1 );
		expect( vdom.props.__directives.context[ 0 ] ).toMatchObject( {
			suffix: null,
			uniqueId: 'unique',
			value: { prop: 'value' },
		} );
	} );

	test( 'should parse directive with suffix and unique ID', () => {
		container.innerHTML = `
			<div data-wp-on--click---unique="actions.test">
				<span>Test</span>
			</div>
		`;

		const vdom = toVdom( container.firstElementChild as HTMLElement );

		expect( vdom.props.__directives ).toBeDefined();
		expect( vdom.props.__directives.on ).toHaveLength( 1 );
		expect( vdom.props.__directives.on[ 0 ] ).toMatchObject( {
			suffix: 'click',
			uniqueId: 'unique',
			value: 'actions.test',
		} );
	} );

	test( 'should parse multiple directives with unique IDs', () => {
		container.innerHTML = `
			<div
				data-wp-context='{"prop1": "first"}'
				data-wp-context---second='{"prop2": "second"}'
				data-wp-context---third='{"prop3": "third"}'
			>
				<span>Test</span>
			</div>
		`;

		const vdom = toVdom( container.firstElementChild as HTMLElement );

		expect( vdom.props.__directives ).toBeDefined();
		expect( vdom.props.__directives.context ).toHaveLength( 3 );

		const contexts = vdom.props.__directives.context;
		expect( contexts[ 0 ] ).toMatchObject( {
			suffix: null,
			uniqueId: undefined,
			value: { prop1: 'first' },
		} );
		expect( contexts[ 1 ] ).toMatchObject( {
			suffix: null,
			uniqueId: 'second',
			value: { prop2: 'second' },
		} );
		expect( contexts[ 2 ] ).toMatchObject( {
			suffix: null,
			uniqueId: 'third',
			value: { prop3: 'third' },
		} );
	} );

	test( 'should handle mix of regular and unique ID directives', () => {
		container.innerHTML = `
			<div
				data-wp-on--click="actions.regular"
				data-wp-on--click---unique="actions.unique"
			>
				<span>Test</span>
			</div>
		`;

		const vdom = toVdom( container.firstElementChild as HTMLElement );

		expect( vdom.props.__directives ).toBeDefined();
		expect( vdom.props.__directives.on ).toHaveLength( 2 );

		const handlers = vdom.props.__directives.on;
		expect( handlers[ 0 ] ).toMatchObject( {
			suffix: 'click',
			uniqueId: undefined,
			value: 'actions.regular',
		} );
		expect( handlers[ 1 ] ).toMatchObject( {
			suffix: 'click',
			uniqueId: 'unique',
			value: 'actions.unique',
		} );
	} );

	test( 'should reject malformed directive names', () => {
		const consoleSpy = jest.spyOn( console, 'warn' ).mockImplementation();

		container.innerHTML = `
			<div data-wp-invalid[name]="value">
				<span>Test</span>
			</div>
		`;

		const vdom = toVdom( container.firstElementChild as HTMLElement );

		expect( consoleSpy ).toHaveBeenCalledWith(
			'Found malformed directive name: data-wp-invalid[name].'
		);
		expect( vdom.props.__directives ).toEqual( {} );

		consoleSpy.mockRestore();
	} );

	test( 'should handle complex unique ID patterns', () => {
		container.innerHTML = `
			<div
				data-wp-watch---plugin-1="callbacks.watch1"
				data-wp-init---my_plugin="callbacks.init"
				data-wp-context---plugin-2='{"active": true}'
			>
				<span>Test</span>
			</div>
		`;

		const vdom = toVdom( container.firstElementChild as HTMLElement );

		expect( vdom.props.__directives ).toBeDefined();
		expect( vdom.props.__directives.watch[ 0 ].uniqueId ).toBe(
			'plugin-1'
		);
		expect( vdom.props.__directives.init[ 0 ].uniqueId ).toBe(
			'my_plugin'
		);
		expect( vdom.props.__directives.context[ 0 ].uniqueId ).toBe(
			'plugin-2'
		);
	} );

	test( 'should warn about potentially confusing double-dash patterns', () => {
		const consoleSpy = jest.spyOn( console, 'warn' ).mockImplementation();

		container.innerHTML = `
			<div
				data-wp-context--unique-identifier="value"
				data-wp-watch--my-plugin="callback"
				data-wp-init--plugin-name="init"
			>
				<span>Test</span>
			</div>
		`;

		toVdom( container.firstElementChild as HTMLElement );

		expect( consoleSpy ).toHaveBeenCalledWith(
			'Directive "data-wp-context--unique-identifier" uses "--unique-identifier" which could be confused with a unique ID. For unique IDs, use triple dashes: "---unique-identifier". The double-dash syntax is reserved for directive suffixes.'
		);
		expect( consoleSpy ).toHaveBeenCalledWith(
			'Directive "data-wp-watch--my-plugin" uses "--my-plugin" which could be confused with a unique ID. For unique IDs, use triple dashes: "---my-plugin". The double-dash syntax is reserved for directive suffixes.'
		);
		expect( consoleSpy ).toHaveBeenCalledWith(
			'Directive "data-wp-init--plugin-name" uses "--plugin-name" which could be confused with a unique ID. For unique IDs, use triple dashes: "---plugin-name". The double-dash syntax is reserved for directive suffixes.'
		);

		consoleSpy.mockRestore();
	} );

	test( 'should not warn about obvious event handler suffixes', () => {
		const consoleSpy = jest.spyOn( console, 'warn' ).mockImplementation();

		container.innerHTML = `
			<div
				data-wp-on--click="handler"
				data-wp-on--hover="handler"
				data-wp-on--focus="handler"
				data-wp-on--blur="handler"
			>
				<span>Test</span>
			</div>
		`;

		toVdom( container.firstElementChild as HTMLElement );

		// Should not warn for obvious event handler suffixes
		expect( consoleSpy ).not.toHaveBeenCalled();

		consoleSpy.mockRestore();
	} );

	test( 'should not warn about short suffixes', () => {
		const consoleSpy = jest.spyOn( console, 'warn' ).mockImplementation();

		container.innerHTML = `
			<div
				data-wp-context--id="value"
				data-wp-watch--a="callback"
			>
				<span>Test</span>
			</div>
		`;

		toVdom( container.firstElementChild as HTMLElement );

		// Should not warn for short suffixes (3 characters or less)
		expect( consoleSpy ).not.toHaveBeenCalled();

		consoleSpy.mockRestore();
	} );
} );
