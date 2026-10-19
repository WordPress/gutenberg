import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import DuotoneSwatch from '../duotone-swatch';

describe( 'DuotoneSwatch', () => {
	it( 'should render a color indicator filled with the duotone gradient', () => {
		const { container } = render(
			<DuotoneSwatch values={ [ '#8c00b7', '#fcff41' ] } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the swatch icon when there are no values', () => {
		const { container } = render( <DuotoneSwatch values={ null } /> );

		expect( container ).toMatchSnapshot();
	} );
} );
