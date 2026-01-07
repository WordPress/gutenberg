import { render } from '@testing-library/react';
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
} );
