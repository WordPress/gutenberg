import { describe, expect, it } from 'vitest';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';
import {
	createRuntimeActionsMap,
	declareRuntimeActions,
} from '../utils/runtime-actions-map';

const review: WidgetRuntimeAction[] = [
	{ id: 'review', label: 'Review 4 items', href: '#review' },
];
const reviewFewer: WidgetRuntimeAction[] = [
	{ id: 'review', label: 'Review 3 items', href: '#review' },
];

describe( 'declareRuntimeActions', () => {
	it( 'keeps what a render declares while a copy of the instance declares nothing', () => {
		const map = createRuntimeActionsMap();
		declareRuntimeActions( map, 'w1', 'tile', review );

		declareRuntimeActions( map, 'w1', 'copy', [] );

		expect( [ ...map.get( 'w1' )!.values() ] ).toEqual( [ review ] );
	} );

	it( 'keeps what a render declares after a copy withdraws its own', () => {
		const map = createRuntimeActionsMap();
		declareRuntimeActions( map, 'w1', 'tile', review );
		declareRuntimeActions( map, 'w1', 'copy', review );

		declareRuntimeActions( map, 'w1', 'copy', [] );

		expect( [ ...map.get( 'w1' )!.keys() ] ).toEqual( [ 'tile' ] );
	} );

	it( 'keeps the first render first when it declares again', () => {
		const map = createRuntimeActionsMap();
		declareRuntimeActions( map, 'w1', 'tile', review );
		declareRuntimeActions( map, 'w1', 'copy', review );

		declareRuntimeActions( map, 'w1', 'tile', reviewFewer );

		expect( [ ...map.get( 'w1' )!.values() ] ).toEqual( [
			reviewFewer,
			review,
		] );
	} );

	it( 'clears the instance once every render withdraws', () => {
		const map = createRuntimeActionsMap();
		declareRuntimeActions( map, 'w1', 'tile', review );
		declareRuntimeActions( map, 'w1', 'copy', review );

		declareRuntimeActions( map, 'w1', 'tile', [] );
		declareRuntimeActions( map, 'w1', 'copy', [] );

		expect( map.get( 'w1' ) ).toBeUndefined();
	} );
} );
