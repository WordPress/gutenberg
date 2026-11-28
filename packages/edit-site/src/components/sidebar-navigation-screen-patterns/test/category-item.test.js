import { describe, expect, it } from 'vitest';
import CategoryItem from '../category-item';
import {
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
} from '../../../utils/constants';

describe( 'CategoryItem', () => {
	it( 'renders user pattern categories even when count is 0', () => {
		const element = CategoryItem( {
			count: 0,
			id: 'custom-category',
			label: 'Custom Category',
			type: PATTERN_TYPES.user,
		} );

		expect( element ).toBeDefined();
		expect( element.props.to ).toBe(
			'/pattern?postType=wp_block&categoryId=custom-category'
		);
		expect( element.props.children ).toBe( 'Custom Category' );
		expect( element.props.suffix.props.children ).toBe( 0 );
	} );

	it( 'renders user pattern categories when count is greater than 0', () => {
		const element = CategoryItem( {
			count: 5,
			id: 'custom-category',
			label: 'Custom Category',
			type: PATTERN_TYPES.user,
		} );

		expect( element ).toBeDefined();
		expect( element.props.suffix.props.children ).toBe( 5 );
	} );

	it( 'does not render when count is undefined (e.g. empty default categories)', () => {
		const element = CategoryItem( {
			count: undefined,
			id: 'banner',
			label: 'Banner',
			type: PATTERN_TYPES.user,
		} );

		expect( element ).toBeUndefined();
	} );

	it( 'does not render empty template part areas when count is 0', () => {
		const element = CategoryItem( {
			count: 0,
			id: 'header',
			label: 'Header',
			type: TEMPLATE_PART_POST_TYPE,
		} );

		expect( element ).toBeUndefined();
	} );
} );
