import { describe, expect, it } from 'vitest';
import {
	getBorderClassNames,
	type BorderClassNames,
} from '../border-class-names';

describe( 'getBorderClassNames', () => {
	it.each( [
		[ 'no border', {}, {} ],
		[
			'unified width and radius',
			{ style: { border: { width: '4px', radius: '20px' } } },
			{ 'has-border': true, 'has-border-radius': true },
		],
		[
			'per-side width and corner radii',
			{
				style: {
					border: {
						top: { width: '4px' },
						radius: { topLeft: '20px' },
					},
				},
			},
			{ 'has-border': true, 'has-border-radius': true },
		],
		[
			'colour only',
			{ style: { border: { color: '#000' } } },
			{ 'has-border': true },
		],
		[
			'preset colour only',
			{ borderColor: 'contrast' },
			{ 'has-border': true },
		],
		[
			'radius only',
			{ style: { border: { radius: '20px' } } },
			{ 'has-border-radius': true },
		],
		[
			'empty corner radii',
			{ style: { border: { radius: { topLeft: '' } } } },
			{},
		],
		[ 'malformed border value', { style: { border: 'solid' } }, {} ],
	] as [ string, Record< string, unknown >, Partial< BorderClassNames > ][] )(
		'%s',
		( _name, attributes, expected ) => {
			const classNames = getBorderClassNames( attributes );
			expect( classNames[ 'has-border' ] ?? false ).toBe(
				expected[ 'has-border' ] ?? false
			);
			expect( classNames[ 'has-border-radius' ] ?? false ).toBe(
				expected[ 'has-border-radius' ] ?? false
			);
		}
	);
} );
