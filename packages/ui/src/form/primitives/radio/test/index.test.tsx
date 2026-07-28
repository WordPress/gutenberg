import { render, screen } from '@testing-library/react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { createRef } from '@wordpress/element';
import { Radio } from '../index';

describe( 'Radio', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render(
			<RadioGroup>
				<Radio ref={ ref } value="a" />
			</RadioGroup>
		);

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders a radio', () => {
		render(
			<RadioGroup>
				<Radio value="a" />
			</RadioGroup>
		);

		expect( screen.getByRole( 'radio' ) ).toBeInTheDocument();
	} );

	it( 'renders checked when selected by the radio group', () => {
		render(
			<RadioGroup defaultValue="a">
				<Radio value="a" />
			</RadioGroup>
		);

		expect( screen.getByRole( 'radio' ) ).toBeChecked();
	} );
} );
