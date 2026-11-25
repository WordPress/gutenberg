import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEntityRecords } from '@wordpress/core-data';
import { SlotFillProvider } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { Status } from '../../../../core-data/src/hooks/constants';
import {
	BlockEditContextProvider,
	mayDisplayControlsKey,
} from '../../../../block-editor/src/components/block-edit/context';

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

vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useEntityRecords: vi.fn(),
} ) );

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

const publicTaxonomy = {
	name: 'Categories',
	slug: 'category',
	visibility: { public: true },
	hierarchical: true,
};

const privateTaxonomy = {
	name: 'Secret',
	slug: 'secret',
	visibility: { public: false },
	hierarchical: false,
	labels: { no_terms: 'No tags' },
};

const defaultAttributes = {
	taxonomy: 'category',
	displayAsDropdown: false,
	showHierarchy: false,
	showPostCounts: false,
	showOnlyTopLevel: false,
	showEmpty: false,
	label: '',
	showLabel: true,
};

let CategoriesEdit: ComponentType< {
	attributes: typeof defaultAttributes;
	setAttributes: ( attributes: Partial< typeof defaultAttributes > ) => void;
	clientId: string;
	className: string;
} >;

let taxonomies: ( typeof publicTaxonomy )[] | null;
let terms: unknown[] | null;

function Edit( { taxonomy = 'category' }: { taxonomy?: string } ) {
	return (
		<SlotFillProvider>
			<BlockEditContextProvider
				value={ {
					name: 'core/categories',
					isSelected: true,
					[ mayDisplayControlsKey ]: true,
				} }
			>
				<CategoriesEdit
					attributes={ { ...defaultAttributes, taxonomy } }
					className=""
					setAttributes={ vi.fn() }
					clientId="categories-test"
				/>
				<InspectorControls.Slot />
			</BlockEditContextProvider>
		</SlotFillProvider>
	);
}

describe( 'Categories taxonomy setting', () => {
	beforeAll( async () => {
		const { default: EditComponent } = await vi.importActual< {
			default: typeof CategoriesEdit;
		} >( '../edit' );
		CategoriesEdit = EditComponent;
	} );

	beforeEach( () => {
		taxonomies = [];
		terms = null;
		vi.mocked( useEntityRecords ).mockImplementation( ( kind ) => {
			const records = kind === 'root' ? taxonomies : terms;
			const isResolving = records === null;
			return {
				records,
				isResolving,
				hasStarted: true,
				hasResolved: ! isResolving,
				status: isResolving ? Status.Resolving : Status.Success,
				totalItems: records?.length ?? null,
				totalPages: records ? 1 : null,
			};
		} );
	} );

	test.each( [
		{ records: [] },
		{ records: [ { ...publicTaxonomy, visibility: { public: false } } ] },
	] )(
		'omits Taxonomy from Settings and its options menu without public taxonomies: $records',
		async ( { records } ) => {
			const user = userEvent.setup();
			taxonomies = records;
			render( <Edit /> );

			expect(
				screen.queryByRole( 'combobox', { name: 'Taxonomy' } )
			).not.toBeInTheDocument();
			await user.click(
				screen.getByRole( 'button', { name: 'Settings options' } )
			);
			expect( screen.queryByText( 'Taxonomy' ) ).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Display as dropdown',
				} )
			).toBeInTheDocument();
		}
	);

	test( 'shows Taxonomy when public taxonomies finish loading', async () => {
		const user = userEvent.setup();
		taxonomies = null;
		const { rerender } = render( <Edit /> );
		expect(
			screen.queryByRole( 'combobox', { name: 'Taxonomy' } )
		).not.toBeInTheDocument();

		taxonomies = [ publicTaxonomy ];
		rerender( <Edit /> );

		expect(
			screen.getByRole( 'combobox', { name: 'Taxonomy' } )
		).toHaveTextContent( 'Categories' );
		await user.click(
			screen.getByRole( 'button', { name: 'Settings options' } )
		);
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Taxonomy' } )
		).toBeInTheDocument();
	} );

	test( 'shows the no terms label and Taxonomy for an empty taxonomy that is not public', () => {
		taxonomies = [ publicTaxonomy, privateTaxonomy ];
		terms = [];
		render( <Edit taxonomy="secret" /> );

		expect( screen.getByText( 'No tags' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'combobox', { name: 'Taxonomy' } )
		).toHaveTextContent( 'secret (unavailable)' );
	} );
} );
