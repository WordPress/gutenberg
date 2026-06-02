import { render } from '@testing-library/react';
import DotTip, { DotTip as NamedDotTip } from '..';

describe( 'DotTip', () => {
	it( 'renders nothing when accessed through the default export', () => {
		const { container } = render(
			<DotTip tipId="test/tip">Tip content</DotTip>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when accessed through the named export', () => {
		const { container } = render(
			<NamedDotTip tipId="test/tip">Tip content</NamedDotTip>
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
