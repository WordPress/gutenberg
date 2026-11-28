import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TextIndentControl from '../';

describe( 'TextIndentControl', () => {
	it.each( [ false, true ] )(
		'should forward UnitControl props to the input when withSlider is %s',
		( withSlider ) => {
			render(
				<TextIndentControl
					value="1em"
					onChange={ () => {} }
					withSlider={ withSlider }
					disabled
				/>
			);

			expect(
				screen.getByRole( 'spinbutton', { name: 'Line indent' } )
			).toBeDisabled();
		}
	);
} );
