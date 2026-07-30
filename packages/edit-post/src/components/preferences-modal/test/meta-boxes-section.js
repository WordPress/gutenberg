/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect, select as realSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { MetaBoxesSection } from '../meta-boxes-section';
import { store as editPostStore } from '../../../store';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

// Override only the selectors the section reads, while delegating the rest
// (used by the rendered child options) to the real registry.
function setupUseSelect( { areCustomFieldsRegistered, metaBoxes } ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( ( store ) => {
			if ( store === editorStore ) {
				return {
					...realSelect( store ),
					getEditorSettings: () => ( {
						enableCustomFields: areCustomFieldsRegistered
							? false
							: undefined,
					} ),
				};
			}
			if ( store === editPostStore ) {
				return {
					...realSelect( store ),
					getAllMetaBoxes: () => metaBoxes,
				};
			}
			return realSelect( store );
		} )
	);
}

describe( 'MetaBoxesSection', () => {
	it( 'does not render if there are no options', () => {
		setupUseSelect( {
			areCustomFieldsRegistered: false,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
			],
		} );
		render( <MetaBoxesSection /> );
		expect( screen.queryByRole( 'group' ) ).not.toBeInTheDocument();
	} );

	it( 'renders a Custom Fields option', () => {
		setupUseSelect( {
			areCustomFieldsRegistered: true,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
			],
		} );
		render( <MetaBoxesSection title="Advanced panels" /> );
		expect(
			screen.getByRole( 'group', { name: 'Advanced panels' } )
		).toMatchSnapshot();
	} );

	it( 'renders meta box options', () => {
		setupUseSelect( {
			areCustomFieldsRegistered: false,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
				{ id: 'test1', title: 'Meta Box 1' },
				{ id: 'test2', title: 'Meta Box 2' },
			],
		} );
		render( <MetaBoxesSection title="Advanced panels" /> );
		expect(
			screen.getByRole( 'group', { name: 'Advanced panels' } )
		).toMatchSnapshot();
	} );

	it( 'renders a Custom Fields option and meta box options', () => {
		setupUseSelect( {
			areCustomFieldsRegistered: true,
			metaBoxes: [
				{ id: 'postcustom', title: 'This should not render' },
				{ id: 'test1', title: 'Meta Box 1' },
				{ id: 'test2', title: 'Meta Box 2' },
			],
		} );
		render( <MetaBoxesSection title="Advanced panels" /> );
		expect(
			screen.getByRole( 'group', { name: 'Advanced panels' } )
		).toMatchSnapshot();
	} );
} );
