/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import AvatarGroup from '..';
import Avatar from '../../avatar';

describe( 'AvatarGroup', () => {
	it( 'should render all children when count is within max', () => {
		render(
			<AvatarGroup>
				<Avatar name="Alice" />
				<Avatar name="Bob" />
			</AvatarGroup>
		);
		expect(
			screen.getByRole( 'img', { name: 'Alice' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'img', { name: 'Bob' } )
		).toBeInTheDocument();
		expect( screen.queryByText( /^\+/ ) ).not.toBeInTheDocument();
	} );

	it( 'should show overflow indicator when children exceed max', () => {
		render(
			<AvatarGroup max={ 2 }>
				<Avatar name="Alice" />
				<Avatar name="Bob" />
				<Avatar name="Charlie" />
				<Avatar name="Diana" />
			</AvatarGroup>
		);
		expect(
			screen.getByRole( 'img', { name: 'Alice' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'img', { name: 'Bob' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'img', { name: 'Charlie' } )
		).not.toBeInTheDocument();
		const overflow = screen.getByText( '+2' );
		expect( overflow ).toBeInTheDocument();
		expect( overflow ).toHaveAttribute(
			'aria-label',
			'2 more collaborators'
		);
	} );

	it( 'should use singular form for one overflow collaborator', () => {
		render(
			<AvatarGroup max={ 2 }>
				<Avatar name="Alice" />
				<Avatar name="Bob" />
				<Avatar name="Charlie" />
			</AvatarGroup>
		);
		const overflow = screen.getByText( '+1' );
		expect( overflow ).toHaveAttribute(
			'aria-label',
			'1 more collaborator'
		);
	} );

	it( 'should default max to 3', () => {
		render(
			<AvatarGroup>
				<Avatar name="A" />
				<Avatar name="B" />
				<Avatar name="C" />
				<Avatar name="D" />
				<Avatar name="E" />
			</AvatarGroup>
		);
		expect( screen.getByRole( 'img', { name: 'A' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'img', { name: 'B' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'img', { name: 'C' } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'img', { name: 'D' } )
		).not.toBeInTheDocument();
		expect( screen.getByText( '+2' ) ).toBeInTheDocument();
	} );

	it( 'should not show overflow when children equal max', () => {
		render(
			<AvatarGroup max={ 3 }>
				<Avatar name="A" />
				<Avatar name="B" />
				<Avatar name="C" />
			</AvatarGroup>
		);
		expect( screen.queryByText( /^\+/ ) ).not.toBeInTheDocument();
	} );

	it( 'should not show overflow when children are fewer than max', () => {
		render(
			<AvatarGroup max={ 5 }>
				<Avatar name="A" />
				<Avatar name="B" />
			</AvatarGroup>
		);
		expect( screen.queryByText( /^\+/ ) ).not.toBeInTheDocument();
	} );

	it( 'should combine custom className with default class', () => {
		render(
			<AvatarGroup data-testid="group" className="custom">
				<Avatar name="A" />
			</AvatarGroup>
		);
		const group = screen.getByTestId( 'group' );
		expect( group ).toHaveClass( 'editor-avatar-group' );
		expect( group ).toHaveClass( 'custom' );
	} );

	it( 'should have group role and support aria-label', () => {
		render(
			<AvatarGroup aria-label="Collaborators">
				<Avatar name="A" />
			</AvatarGroup>
		);
		const group = screen.getByRole( 'group', {
			name: 'Collaborators',
		} );
		expect( group ).toBeInTheDocument();
	} );

	it( 'should render with no children', () => {
		render( <AvatarGroup data-testid="group" /> );
		const group = screen.getByTestId( 'group' );
		expect( group ).toBeInTheDocument();
		expect( screen.queryByText( /^\+/ ) ).not.toBeInTheDocument();
	} );
} );
