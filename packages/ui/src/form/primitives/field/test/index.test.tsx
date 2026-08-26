import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Field from '../index';

describe( 'Field', () => {
	it( 'forwards ref', () => {
		const rootRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();
		const controlRef = createRef< HTMLInputElement >();
		const labelRef = createRef< HTMLLabelElement >();
		const descriptionRef = createRef< HTMLParagraphElement >();
		const detailsRef = createRef< HTMLDivElement >();

		render(
			<Field.Root ref={ rootRef } name="test-field">
				<Field.Item ref={ itemRef }>
					<Field.Label ref={ labelRef }>Field Label</Field.Label>
					<Field.Control ref={ controlRef } render={ <input /> } />
					<Field.Description ref={ descriptionRef }>
						Field description
					</Field.Description>
					<Field.Details ref={ detailsRef }>
						Field <a href="#details">details</a>
					</Field.Details>
				</Field.Item>
			</Field.Root>
		);

		expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( controlRef.current ).toBeInstanceOf( HTMLInputElement );
		expect( labelRef.current ).toBeInstanceOf( HTMLLabelElement );
		expect( descriptionRef.current ).toBeInstanceOf( HTMLParagraphElement );
		expect( detailsRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'keeps the accessible name when the label is visually hidden', () => {
		render(
			<Field.Root>
				<Field.Label hideFromVision>Field Label</Field.Label>
				<Field.Control render={ <input /> } />
			</Field.Root>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'Field Label' } )
		).toBeVisible();
	} );

	it( 'preserves the native label element when hideFromVision is enabled', () => {
		render(
			<Field.Root>
				<Field.Label hideFromVision>Field Label</Field.Label>
				<Field.Control render={ <input /> } />
			</Field.Root>
		);

		expect( screen.getByText( 'Field Label' ).tagName ).toBe( 'LABEL' );
	} );

	it( 'renders details with a semantically associated description for the control', () => {
		render(
			<Field.Root>
				<Field.Label>Field Label</Field.Label>
				<Field.Control render={ <input /> } />
				<Field.Details>
					<a href="#details">Details</a>
				</Field.Details>
			</Field.Root>
		);

		expect(
			screen.getByRole( 'textbox', {
				name: 'Field Label',
				description: 'More details follow the field.',
			} )
		).toBeVisible();

		expect( screen.getByRole( 'link', { name: 'Details' } ) ).toBeVisible();
	} );

	it( 'forwards ref on visual subcomponents', () => {
		const visualLabelRef = createRef< HTMLSpanElement >();
		const visualDescriptionRef = createRef< HTMLParagraphElement >();

		render(
			<>
				<Field.VisualLabel ref={ visualLabelRef }>
					Visual label
				</Field.VisualLabel>
				<Field.VisualDescription ref={ visualDescriptionRef }>
					Visual description
				</Field.VisualDescription>
			</>
		);

		expect( visualLabelRef.current ).toBeInstanceOf( HTMLSpanElement );
		expect( visualDescriptionRef.current ).toBeInstanceOf(
			HTMLParagraphElement
		);
	} );

	it( 'does not associate visual subcomponents with controls', () => {
		render(
			<>
				<Field.VisualLabel>Visual label</Field.VisualLabel>
				<Field.VisualDescription>
					Visual description
				</Field.VisualDescription>
				<input aria-label="Control label" />
			</>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'Control label' } )
		).not.toHaveAccessibleDescription( 'Visual description' );
		expect( screen.queryByText( 'Visual label' )?.tagName ).toBe( 'SPAN' );
	} );
} );
