import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import DuotoneSwatch from '../duotone-swatch';

describe( 'DuotoneSwatch', () => {
	it( 'should render a color indicator filled with the duotone gradient', () => {
		const { container } = render(
			<DuotoneSwatch values={ [ '#8c00b7', '#fcff41' ] } />
		);

		// The swatch has no role or text, so check the rendered element directly.
		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstElementChild ).toHaveStyle( {
			background:
				'linear-gradient(135deg, #8c00b7 0%, #8c00b7 50%, #fcff41 50%, #fcff41 100%)',
		} );
	} );

	it( 'should render the swatch icon when there are no values', () => {
		const { container } = render( <DuotoneSwatch values={ null } /> );

		expect( container ).toMatchSnapshot();
	} );
} );
