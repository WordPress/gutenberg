import { describe, expect, it } from 'vitest';
import { getBreakingChanges } from '../contracts.mjs';

const released = {
	label: { type: 'string', required: true },
	tone: { type: 'string', enum: [ 'brand', 'neutral' ] },
};

describe( 'getBreakingChanges', () => {
	it( 'accepts a required prop renamed with a deprecation', () => {
		expect(
			getBreakingChanges(
				'button',
				released,
				{
					text: { type: 'string', required: true },
					tone: released.tone,
				},
				[ { prop: 'label', replacement: 'text', since: '1.0.0' } ]
			)
		).toEqual( [] );
	} );

	it( 'reports a renamed required prop whose type changed', () => {
		expect(
			getBreakingChanges(
				'button',
				released,
				{
					text: { type: 'number', required: true },
					tone: released.tone,
				},
				[ { prop: 'label', replacement: 'text', since: '1.0.0' } ]
			)
		).toEqual( [
			'button: the "text" prop, renamed from "label", changed from string to number.',
		] );
	} );

	it( 'reports a new required prop', () => {
		expect(
			getBreakingChanges( 'button', released, {
				...released,
				icon: { type: 'string', required: true },
			} )
		).toEqual( [ 'button: the "icon" prop became required.' ] );
	} );

	it( 'reports an optional prop renamed to a required one', () => {
		expect(
			getBreakingChanges(
				'button',
				released,
				{
					label: released.label,
					intent: { type: 'string', required: true },
				},
				[ { prop: 'tone', replacement: 'intent', since: '1.0.0' } ]
			)
		).toEqual( [ 'button: the "intent" prop became required.' ] );
	} );

	it( 'reports a required prop removed without a deprecation', () => {
		expect(
			getBreakingChanges( 'button', released, {
				text: { type: 'string', required: true },
				tone: released.tone,
			} )
		).toEqual( [
			'button: the "label" prop was removed.',
			'button: the "text" prop became required.',
		] );
	} );
} );
