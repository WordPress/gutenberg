import styled from '@emotion/styled';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe( 'Emotion snapshot serializer', () => {
	it( 'preserves the established class and CSS snapshot format', () => {
		const Box = styled.div`
			color: red;
		`;
		const { container } = render( <Box>Content</Box> );

		// eslint-disable-next-line testing-library/no-node-access -- The serializer input is the rendered root node.
		expect( container.firstChild ).toMatchInlineSnapshot( `
			.emotion-0 {
			  color: red;
			}

			<div
			  class="emotion-0 emotion-1"
			>
			  Content
			</div>
		` );
	} );

	it( 'preserves stable labels for empty styled components', () => {
		const EmptyBox = styled.div``;
		const { container } = render( <EmptyBox>Content</EmptyBox> );

		// eslint-disable-next-line testing-library/no-node-access -- The serializer input is the rendered root node.
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
