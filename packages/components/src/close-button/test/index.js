import { render } from '@testing-library/react';
import React from 'react';

import { CloseButton } from '../index';

describe('props', () => {
	test('should render correctly', () => {
		const { container } = render(<CloseButton />);
		expect(container.firstChild).toMatchSnapshot();
	});

	test('should render variant', () => {
		const { container } = render(<CloseButton variant="primary" />);
		expect(container.firstChild).toMatchSnapshot();
	});

	test('should render size', () => {
		const { container } = render(<CloseButton size="large" />);
		expect(container.firstChild).toMatchSnapshot();
	});
});
