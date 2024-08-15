/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { MetaBoxesSection } from '../meta-boxes-section';

describe( 'MetaBoxesSection', () => {
	it( 'does not render if there are no options', () => {
		render(
			<MetaBoxesSection
				areCustomFieldsRegistered={ false }
				metaBoxes={ [
					{ id: 'postcustom', title: 'This should not render' },
				] }
			/>
		);
		expect( screen.queryByRole( 'group' ) ).not.toBeInTheDocument();
	} );

	it( 'renders a Custom Fields option', () => {
		render(
			<MetaBoxesSection
				title="Advanced panels"
				areCustomFieldsRegistered
				metaBoxes={ [
					{ id: 'postcustom', title: 'This should not render' },
				] }
			/>
		);
		expect(
			screen.getByRole( 'group', { name: 'Advanced panels' } )
		).toMatchSnapshot();
	} );

	it( 'renders meta box options', () => {
		render(
			<MetaBoxesSection
				title="Advanced panels"
				areCustomFieldsRegistered={ false }
				metaBoxes={ [
					{ id: 'postcustom', title: 'This should not render' },
					{ id: 'test1', title: 'Meta Box 1' },
					{ id: 'test2', title: 'Meta Box 2' },
				] }
			/>
		);
		expect(
			screen.getByRole( 'group', { name: 'Advanced panels' } )
		).toMatchSnapshot();
	} );

	it( 'renders a Custom Fields option and meta box options', () => {
		render(
			<MetaBoxesSection
				title="Advanced panels"
				areCustomFieldsRegistered
				metaBoxes={ [
					{ id: 'postcustom', title: 'This should not render' },
					{ id: 'test1', title: 'Meta Box 1' },
					{ id: 'test2', title: 'Meta Box 2' },
				] }
			/>
		);
		expect(
			screen.getByRole( 'group', { name: 'Advanced panels' } )
		).toMatchSnapshot();
	} );
} );
