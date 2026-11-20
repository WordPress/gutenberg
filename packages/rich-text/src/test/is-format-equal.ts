import { describe, expect, it } from 'vitest';
import { isFormatEqual } from '../is-format-equal';
import type { ParsedFormat } from '../types';

type IsFormatEqualCase = {
	format1?: Partial< ParsedFormat >;
	format2?: Partial< ParsedFormat >;
	isEqual: boolean;
	description: string;
};

describe( 'isFormatEqual', () => {
	const spec: IsFormatEqualCase[] = [
		{
			format1: undefined,
			format2: undefined,
			isEqual: true,
			description: 'should return true if both are undefined',
		},
		{
			format1: {},
			format2: undefined,
			isEqual: false,
			description: 'should return false if one is undefined',
		},
		{
			format1: { type: 'bold' },
			format2: { type: 'bold' },
			isEqual: true,
			description: 'should return true if both have same type',
		},
		{
			format1: { type: 'bold' },
			format2: { type: 'italic' },
			isEqual: false,
			description: 'should return false if one has different type',
		},
		{
			format1: { type: 'bold', attributes: {} },
			format2: { type: 'bold' },
			isEqual: false,
			description: 'should return false if one has undefined attributes',
		},
		{
			format1: { type: 'bold', attributes: { a: '1' } },
			format2: { type: 'bold', attributes: { a: '1' } },
			isEqual: true,
			description: 'should return true if both have same attributes',
		},
		{
			format1: { type: 'bold', attributes: { a: '1' } },
			format2: { type: 'bold', attributes: { b: '1' } },
			isEqual: false,
			description: 'should return false if one has different attributes',
		},
		{
			format1: { type: 'bold', attributes: { a: '1' } },
			format2: { type: 'bold', attributes: { a: '1', b: '1' } },
			isEqual: false,
			description:
				'should return false if one has a different amount of attributes',
		},
		{
			format1: { type: 'bold', attributes: { b: '1', a: '1' } },
			format2: { type: 'bold', attributes: { a: '1', b: '1' } },
			isEqual: true,
			description:
				'should return true both have same attributes but different order',
		},
		{
			format1: { type: 'bold', attributes: { 'data-test': '1' } },
			format2: {
				type: 'bold',
				unregisteredAttributes: { 'data-test': '1' },
			},
			isEqual: true,
			description:
				'should return true if one has the same attributes but unregistered',
		},
		{
			format1: { type: 'bold', attributes: { 'data-test': '1' } },
			format2: {
				type: 'bold',
				unregisteredAttributes: { 'data-test': '2' },
			},
			isEqual: false,
			description:
				'should return false if an unregistered attribute has a different value',
		},
		{
			format1: {
				type: 'bold',
				attributes: { a: '1' },
				unregisteredAttributes: { 'data-test': '1' },
			},
			format2: {
				type: 'bold',
				attributes: { a: '1', 'data-test': '1' },
			},
			isEqual: true,
			description:
				'should return true if attributes are split between registered and unregistered',
		},
		{
			format1: { type: 'bold' },
			format2: { type: 'bold', unregisteredAttributes: { a: '1' } },
			isEqual: false,
			description:
				'should return false if only one has unregistered attributes',
		},
	];

	spec.forEach( ( { format1, format2, isEqual, description } ) => {
		it( description, () => {
			expect(
				isFormatEqual(
					format1 as ParsedFormat | undefined,
					format2 as ParsedFormat | undefined
				)
			).toBe( isEqual );
		} );
	} );
} );
