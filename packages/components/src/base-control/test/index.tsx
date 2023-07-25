/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import BaseControl from '..';
import { useBaseControlProps } from '../hooks';
import type { BaseControlProps } from '../types';

const MyBaseControl = ( props: Omit< BaseControlProps, 'children' > ) => {
	const { baseControlProps, controlProps } = useBaseControlProps( props );

	return (
		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom={ true }>
			<textarea { ...controlProps } />
		</BaseControl>
	);
};

describe( 'BaseControl', () => {
	it( 'should render help text as description', () => {
		render( <MyBaseControl label="Text" help="My help text" /> );

		expect(
			screen.getByRole( 'textbox', {
				description: 'My help text',
			} )
		).toBeInTheDocument();
	} );

	it( 'should render help as aria-details when not plain text', () => {
		render(
			<MyBaseControl
				label="Text"
				help={ <a href="/foo">My help text</a> }
			/>
		);

		const textarea = screen.getByRole( 'textbox' );
		const help = screen.getByRole( 'link', {
			name: 'My help text',
		} );

		expect( textarea ).toHaveAttribute( 'aria-details' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			help.closest( `#${ textarea.getAttribute( 'aria-details' ) }` )
		).toBeVisible();
	} );
} );
