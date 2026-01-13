import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Fieldset from '../';

describe( 'Fieldset', () => {
	it( 'forwards ref', () => {
		const rootRef = createRef< HTMLFieldSetElement >();
		const legendRef = createRef< HTMLDivElement >();
		const descriptionRef = createRef< HTMLParagraphElement >();
		const detailsRef = createRef< HTMLDivElement >();

		render(
			<Fieldset.Root ref={ rootRef }>
				<Fieldset.Legend ref={ legendRef }>
					Fieldset Legend
				</Fieldset.Legend>
				<Fieldset.Description ref={ descriptionRef }>
					Fieldset description
				</Fieldset.Description>
				<Fieldset.Details ref={ detailsRef }>
					Fieldset details
				</Fieldset.Details>
			</Fieldset.Root>
		);

		expect( rootRef.current ).toBeInstanceOf( HTMLFieldSetElement );
		expect( legendRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( descriptionRef.current ).toBeInstanceOf( HTMLParagraphElement );
		expect( detailsRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'accessibly associates description when Fieldset.Description is present', () => {
		render(
			<Fieldset.Root>
				<Fieldset.Legend>Choose your options</Fieldset.Legend>
				<Fieldset.Description>
					Select one or more options from the list below.
				</Fieldset.Description>
			</Fieldset.Root>
		);

		expect(
			screen.getByRole( 'group', {
				name: 'Choose your options',
				description: 'Select one or more options from the list below.',
			} )
		).toBeVisible();
	} );

	it( 'does not add aria-describedby when Fieldset.Description is not present', () => {
		render(
			<Fieldset.Root>
				<Fieldset.Legend>Choose your options</Fieldset.Legend>
			</Fieldset.Root>
		);

		const fieldset = screen.getByRole( 'group', {
			name: 'Choose your options',
		} );

		// Should not have aria-describedby
		expect( fieldset ).not.toHaveAttribute( 'aria-describedby' );
	} );

	it( 'respects custom id on description', () => {
		const customId = 'custom-description-id';

		render(
			<Fieldset.Root>
				<Fieldset.Legend>Choose your options</Fieldset.Legend>
				<Fieldset.Description id={ customId }>
					Custom description with specific ID.
				</Fieldset.Description>
			</Fieldset.Root>
		);

		const description = screen.getByText(
			'Custom description with specific ID.'
		);
		expect( description ).toHaveAttribute( 'id', customId );

		expect(
			screen.getByRole( 'group', {
				name: 'Choose your options',
				description: 'Custom description with specific ID.',
			} )
		).toBeVisible();
	} );

	it( 'forwards className to the description element', () => {
		render(
			<Fieldset.Root>
				<Fieldset.Description className="custom-class">
					Fieldset description
				</Fieldset.Description>
			</Fieldset.Root>
		);

		expect( screen.getByText( 'Fieldset description' ) ).toHaveClass(
			'custom-class'
		);
	} );

	it( 'announces additional details via a visually hidden description', () => {
		render(
			<Fieldset.Root>
				<Fieldset.Legend>Choose your options</Fieldset.Legend>
				<Fieldset.Details>
					<a href="#more-info">Learn more about these options</a>
				</Fieldset.Details>
			</Fieldset.Root>
		);

		expect(
			screen.getByRole( 'group', {
				name: 'Choose your options',
				description: 'More details follow.',
			} )
		).toBeVisible();
	} );

	it( 'forwards className to the details element', () => {
		render(
			<Fieldset.Root>
				<Fieldset.Details className="custom-class">
					Fieldset details
				</Fieldset.Details>
			</Fieldset.Root>
		);

		expect( screen.getByText( 'Fieldset details' ) ).toHaveClass(
			'custom-class'
		);
	} );
} );
