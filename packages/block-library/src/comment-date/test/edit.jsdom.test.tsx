import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { useEntityProp } from '@wordpress/core-data';

vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useEntityProp: vi.fn(),
} ) );

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		useBlockProps: Object.assign(
			vi.fn( ( props ) => props ),
			{
				save: actual.useBlockProps.save,
			}
		),
	};
} );

let Edit: ComponentType< {
	attributes: { format?: string; isLink: boolean };
	context: { commentId?: string };
	setAttributes: () => void;
} >;

function renderEdit( {
	commentId,
	date,
	format,
}: {
	commentId?: string;
	date?: string;
	format?: string;
} ) {
	vi.mocked( useEntityProp ).mockImplementation( ( _kind, _name, prop ) =>
		prop === 'date'
			? [ date, vi.fn(), undefined ]
			: [ 'F j, Y', vi.fn(), undefined ]
	);
	return render(
		<Edit
			attributes={ { isLink: false, format } }
			context={ { commentId } }
			setAttributes={ vi.fn() }
		/>
	);
}

describe( 'Comment Date edit', () => {
	beforeAll( async () => {
		( { default: Edit } = await vi.importActual< {
			default: typeof Edit;
		} >( '../edit' ) );
	} );

	it( 'formats the date with the site format', () => {
		renderEdit( { commentId: '1', date: '2026-11-19T10:00:00' } );

		expect( screen.getByText( 'November 19, 2026' ) ).toBeInTheDocument();
	} );

	it( 'formats the date with the format set on the block', () => {
		renderEdit( {
			commentId: '1',
			date: '2026-11-19T10:00:00',
			format: 'Y/m/d',
		} );

		expect( screen.getByText( '2026/11/19' ) ).toBeInTheDocument();
	} );

	it( 'shows the placeholder when there is no comment', () => {
		renderEdit( {} );

		expect( screen.getByText( 'Comment Date' ) ).toBeInTheDocument();
	} );
} );
