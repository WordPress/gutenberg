/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { GlobalStylesChanges } from '../entity-type-list';

describe( 'GlobalStylesChanges', () => {
	it( 'renders nothing without changes', () => {
		const { container } = render(
			<GlobalStylesChanges changeGroups={ [] } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'lists each change on its own line with a badge per style state', () => {
		render(
			<GlobalStylesChanges
				changeGroups={ [
					{
						group: 'blocks',
						items: [
							{ label: 'Title', states: [ 'Default', 'Mobile' ] },
							{ label: 'Button', states: [] },
						],
					},
					{
						group: 'elements',
						items: [ { label: 'Link', states: [ 'Hover' ] } ],
					},
				] }
			/>
		);

		const [ titleItem, buttonItem, linkItem ] =
			screen.getAllByRole( 'listitem' );

		expect( titleItem ).toHaveTextContent(
			/^Title block\.\s*Default\s*Mobile$/
		);
		expect( buttonItem ).toHaveTextContent( /^Button block\.$/ );
		expect( linkItem ).toHaveTextContent( /^Link element\.\s*Hover$/ );
	} );
} );
