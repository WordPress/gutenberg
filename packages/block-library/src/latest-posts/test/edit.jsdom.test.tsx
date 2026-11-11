import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, useState } from '@wordpress/element';
import LatestPostsEdit from '../edit';

const { useSelectMock, useDispatchMock } = vi.hoisted( () => ( {
	useSelectMock: vi.fn(),
	useDispatchMock: vi.fn(),
} ) );

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockScrollIntoView();
globalThis.wpVitest.mockResizeObserver();

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		InspectorControls: Object.assign(
			( { children }: PropsWithChildren ) => <>{ children }</>,
			{ Slot: original.InspectorControls.Slot }
		),
		BlockControls: Object.assign( () => null, {
			Slot: original.BlockControls.Slot,
		} ),
		useBlockProps: Object.assign(
			() => ( {
				ref: vi.fn(),
				id: 'latest-posts-fixture',
				role: 'list',
				className: '',
				style: {},
			} ),
			{ save: original.useBlockProps.save }
		),
		__experimentalImageSizeControl: () => <></>,
	};
} );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: useSelectMock,
	useDispatch: useDispatchMock,
} ) );

vi.mock( import( '@wordpress/components' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	__experimentalToolsPanel: ( { children }: PropsWithChildren ) => children,
	__experimentalToolsPanelItem: ( { children }: PropsWithChildren ) =>
		children,
} ) );

vi.mock( import( '../../utils/hooks' ), () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

const defaultAttributes = {
	postsToShow: 5,
	order: 'desc',
	orderBy: 'date',
};
const duplicateCategories = [
	{ id: 1, name: 'Parent A', parent: 0 },
	{ id: 2, name: 'Parent B', parent: 0 },
	{ id: 3, name: 'Child', parent: 1 },
	{ id: 4, name: 'Child', parent: 2 },
];
type Category = { id: number; name: string; parent: number };
type Attributes = typeof defaultAttributes & { categories: Category[] };
type EditorProps = {
	initialCategories?: Category[];
	onChange?: ( update: Partial< Attributes > ) => void;
};
let categoryRecords: Category[] | null;

function Editor( { initialCategories = [], onChange = vi.fn() }: EditorProps ) {
	const [ attributes, setAttributes ] = useState( {
		...defaultAttributes,
		categories: initialCategories,
	} );

	return createElement( LatestPostsEdit, {
		__unstableLayoutClassNames: '',
		attributes,
		setAttributes: ( update: Partial< Attributes > ) => {
			setAttributes( ( current ) => ( { ...current, ...update } ) );
			onChange( update );
		},
	} );
}

describe( 'Latest Posts category filters', () => {
	beforeEach( () => {
		categoryRecords = duplicateCategories;
		const select = () => ( {
			getSettings: () => ( { imageSizes: [] } ),
			getEntityRecords: ( kind: string ) =>
				kind === 'taxonomy' ? categoryRecords : [],
			getUsers: () => [],
		} );
		useSelectMock.mockImplementation(
			( callback: ( storeSelect: typeof select ) => unknown ) =>
				callback( select )
		);
		useDispatchMock.mockReturnValue( { createWarningNotice: vi.fn() } );
	} );

	it( 'selects both same-named categories by ID and removes only the chosen category after reload', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { unmount } = render( createElement( Editor, { onChange } ) );
		const input = screen.getByRole( 'combobox', { name: 'Categories' } );

		await user.type( input, 'Child' );
		await user.click(
			screen.getByRole( 'option', { name: 'Child (Parent A)' } )
		);
		await user.type( input, 'Child' );
		await user.click(
			screen.getByRole( 'option', { name: 'Child (Parent B)' } )
		);
		expect( onChange ).toHaveBeenLastCalledWith( {
			categories: [ duplicateCategories[ 2 ], duplicateCategories[ 3 ] ],
		} );

		const savedCategories = onChange.mock.lastCall?.[ 0 ].categories;
		unmount();
		render(
			createElement( Editor, {
				initialCategories: savedCategories,
				onChange,
			} )
		);

		expect(
			screen.getByText( 'Child (Parent A)', { exact: true } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Child (Parent B)', { exact: true } )
		).toBeInTheDocument();
		await user.click(
			screen.getByRole( 'button', {
				name: 'Remove item',
				description: /Child \(Parent A\)/,
			} )
		);
		expect( onChange ).toHaveBeenLastCalledWith( {
			categories: [ duplicateCategories[ 3 ] ],
		} );
	} );

	it( 'keeps unique names and saves the original category object', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		categoryRecords = [ { id: 5, name: 'Unique category', parent: 1 } ];
		render( createElement( Editor, { onChange } ) );

		await user.type(
			screen.getByRole( 'combobox', { name: 'Categories' } ),
			'Unique'
		);
		await user.click(
			screen.getByRole( 'option', { name: 'Unique category' } )
		);
		expect( onChange ).toHaveBeenLastCalledWith( {
			categories: categoryRecords,
		} );
	} );

	it.each( [
		{ status: 'loading', records: null },
		{ status: 'empty', records: [] },
	] )(
		'preserves selected category IDs when available categories are $status',
		async ( { records } ) => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			categoryRecords = records;
			render(
				createElement( Editor, {
					initialCategories: [
						duplicateCategories[ 2 ],
						duplicateCategories[ 3 ],
					],
					onChange,
				} )
			);

			expect(
				screen.getByText( 'Child (3)', { exact: true } )
			).toBeInTheDocument();
			expect(
				screen.getByText( 'Child (4)', { exact: true } )
			).toBeInTheDocument();
			await user.click(
				screen.getByRole( 'button', {
					name: 'Remove item',
					description: /Child \(3\)/,
				} )
			);
			expect( onChange ).toHaveBeenLastCalledWith( {
				categories: [ duplicateCategories[ 3 ] ],
			} );
		}
	);

	it( 'decodes category paths for display and saves the original encoded name', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		categoryRecords = [
			{ id: 1, name: 'Parent &lt;A&gt;', parent: 0 },
			{ id: 2, name: 'Parent B', parent: 0 },
			{ id: 3, name: 'Child &amp; Co', parent: 1 },
			{ id: 4, name: 'Child &amp; Co', parent: 2 },
		];
		render( createElement( Editor, { onChange } ) );

		await user.type(
			screen.getByRole( 'combobox', { name: 'Categories' } ),
			'Child'
		);
		await user.click(
			screen.getByRole( 'option', { name: 'Child & Co (Parent <A>)' } )
		);
		expect(
			screen.getByText( 'Child & Co (Parent <A>)', { exact: true } )
		).toHaveTextContent( 'Child & Co (Parent <A>)' );
		expect( onChange ).toHaveBeenLastCalledWith( {
			categories: [ categoryRecords[ 2 ] ],
		} );
	} );

	it( 'uses the complete ancestor path when immediate parents have the same name', async () => {
		const user = userEvent.setup();
		categoryRecords = [
			{ id: 1, name: 'Grandparent A', parent: 0 },
			{ id: 2, name: 'Grandparent B', parent: 0 },
			{ id: 3, name: 'Parent', parent: 1 },
			{ id: 4, name: 'Parent', parent: 2 },
			{ id: 5, name: 'Child', parent: 3 },
			{ id: 6, name: 'Child', parent: 4 },
		];
		render( createElement( Editor ) );

		await user.type(
			screen.getByRole( 'combobox', { name: 'Categories' } ),
			'Child'
		);
		expect(
			screen.getByRole( 'option', {
				name: 'Child (Grandparent A › Parent)',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'option', {
				name: 'Child (Grandparent B › Parent)',
			} )
		).toBeInTheDocument();
	} );

	it( 'does not let a generated label hide a uniquely named category', async () => {
		const user = userEvent.setup();
		categoryRecords = [
			...duplicateCategories,
			{ id: 5, name: 'Child (Parent A)', parent: 0 },
		];
		render( createElement( Editor ) );

		await user.type(
			screen.getByRole( 'combobox', { name: 'Categories' } ),
			'Child'
		);
		expect(
			screen.getByRole( 'option', { name: 'Child (Parent A)' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'option', { name: 'Child (Parent A) (3)' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'option', { name: 'Child (Parent B)' } )
		).toBeInTheDocument();
	} );

	it( 'rejects input that does not identify an available category', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render( createElement( Editor, { onChange } ) );

		await user.type(
			screen.getByRole( 'combobox', { name: 'Categories' } ),
			'constructor{Enter}'
		);
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
