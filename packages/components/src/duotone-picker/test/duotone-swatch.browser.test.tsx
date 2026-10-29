import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import DuotoneSwatch from '../duotone-swatch';

describe( 'DuotoneSwatch', () => {
	it( 'should render a color indicator filled with the duotone gradient', async () => {
		const { container } = await render(
			<DuotoneSwatch values={ [ '#8c00b7', '#fcff41' ] } />
		);

		// The swatch has no role or text, so check the rendered element directly.

		expect( container.firstElementChild ).toHaveStyle( {
			backgroundImage:
				'linear-gradient(135deg, #8c00b7 0%, #8c00b7 50%, #fcff41 50%, #fcff41 100%)',
		} );
	} );
} );
