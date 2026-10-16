import { describe, expect, it, vi } from 'vitest';
import { createElement } from '@wordpress/element';
import { render, screen } from '@testing-library/react';
import CategoryItem from '../category-item';

vi.mock( import( '../../sidebar-navigation-item' ), async () => {
	const { createElement: createMockElement } =
		await import( '@wordpress/element' );

	return {
		default: ( { children, suffix } ) =>
			createMockElement( 'div', null, children, suffix ),
	};
} );

function renderCategoryItem( props ) {
	return render( createElement( CategoryItem, props ) );
}

describe( 'CategoryItem', () => {
	it( 'renders a user-created category that has no patterns', () => {
		renderCategoryItem( {
			count: 0,
			isUserCategory: true,
			label: 'Empty Category',
			id: 'empty-category',
			type: 'wp_block',
		} );

		expect( screen.getByText( 'Empty Category' ) ).toBeInTheDocument();
	} );

	it( 'keeps hiding a zero-count category that is not user-created', () => {
		renderCategoryItem( {
			count: 0,
			label: 'Built-in Category',
			id: 'built-in-category',
			type: 'wp_block',
		} );

		expect(
			screen.queryByText( 'Built-in Category' )
		).not.toBeInTheDocument();
	} );

	it( 'keeps hiding an empty template part area', () => {
		renderCategoryItem( {
			count: 0,
			label: 'Header',
			id: 'header',
			type: 'wp_template_part',
		} );

		expect( screen.queryByText( 'Header' ) ).not.toBeInTheDocument();
	} );

	it( 'renders a category that has patterns', () => {
		renderCategoryItem( {
			count: 2,
			label: 'Used Category',
			id: 'used-category',
			type: 'wp_block',
		} );

		expect( screen.getByText( 'Used Category' ) ).toBeInTheDocument();
		expect( screen.getByText( '2' ) ).toBeInTheDocument();
	} );
} );
