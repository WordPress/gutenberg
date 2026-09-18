import { describe, expect, it } from 'vitest';
import { fixGlobalAttribute } from '../fix-global-attribute';

const ANCHOR_ATTR_SCHEMA = {
	type: 'string',
	source: 'attribute',
	selector: '[data-anchor] > *',
	attribute: 'id',
};

const ARIA_LABEL_ATTR_SCHEMA = {
	type: 'string',
	source: 'attribute',
	selector: '[data-aria-label] > *',
	attribute: 'aria-label',
};

const blockSettings = {
	category: 'text',
	title: 'block title',
	supports: {
		anchor: true,
		ariaLabel: true,
	},
};

function fixAnchor( attributes, innerHTML, settings = blockSettings ) {
	return fixGlobalAttribute(
		attributes,
		settings,
		innerHTML,
		'anchor',
		'data-anchor',
		ANCHOR_ATTR_SCHEMA
	);
}

function fixAriaLabel( attributes, innerHTML ) {
	return fixGlobalAttribute(
		attributes,
		blockSettings,
		innerHTML,
		'ariaLabel',
		'data-aria-label',
		ARIA_LABEL_ATTR_SCHEMA
	);
}

describe( 'Fix global attribute', () => {
	it( 'should do nothing if the block does not support the attribute', () => {
		const attributes = fixAnchor( { anchor: 'foo' }, '<p></p>', {
			...blockSettings,
			supports: {},
		} );

		expect( attributes.anchor ).toBe( 'foo' );
	} );

	it( 'should assign the attribute found in the markup', () => {
		const attributes = fixAnchor( {}, '<p id="bar"></p>' );

		expect( attributes.anchor ).toBe( 'bar' );
	} );

	it( 'should prefer the markup over a stale attribute', () => {
		const attributes = fixAnchor( { anchor: 'foo' }, '<p id="bar"></p>' );

		expect( attributes.anchor ).toBe( 'bar' );
	} );

	it( 'should remove the attribute when the markup no longer carries it', () => {
		const attributes = fixAnchor( { anchor: 'foo' }, '<p></p>' );

		expect( attributes ).not.toHaveProperty( 'anchor' );
	} );

	it( 'should keep the attribute when there is no markup to compare against', () => {
		const attributes = fixAnchor( { anchor: 'foo' }, '' );

		expect( attributes.anchor ).toBe( 'foo' );
	} );

	it( 'should not mutate the attributes it is given', () => {
		const original = { anchor: 'foo' };
		fixAnchor( original, '<p></p>' );

		expect( original.anchor ).toBe( 'foo' );
	} );

	it( 'should assign and remove ariaLabel by the same rules', () => {
		const assigned = fixAriaLabel( {}, '<p aria-label="Label"></p>' );
		const removed = fixAriaLabel( { ariaLabel: 'Label' }, '<p></p>' );

		expect( assigned.ariaLabel ).toBe( 'Label' );
		expect( removed ).not.toHaveProperty( 'ariaLabel' );
	} );
} );
