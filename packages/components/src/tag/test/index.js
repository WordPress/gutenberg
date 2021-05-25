import { render } from '@testing-library/react';
import { noop } from '@wp-g2/utils';
import React from 'react';

import { Tag } from '../index';

describe('props', () => {
	test('should render correctly', () => {
		const { container } = render(<Tag>Status</Tag>);
		expect(container.firstChild).toMatchSnapshot();
	});

	test('should render color', () => {
		const { container } = render(<Tag color="red">Status</Tag>);
		expect(container.firstChild).toMatchSnapshot();
	});

	test('should render display', () => {
		const { container } = render(<Tag display="block">Status</Tag>);
		expect(container.firstChild).toMatchSnapshot();
	});

	test('should render href', () => {
		const { container } = render(<Tag href="#">Status</Tag>);
		expect(container.firstChild).toMatchSnapshot();
	});

	test('should render onRemove', () => {
		const { container } = render(<Tag onRemove={noop}>Status</Tag>);
		expect(container.firstChild).toMatchSnapshot();
	});

	test('should render removeButtonText', () => {
		const { container } = render(
			<Tag onRemove={noop} removeButtonText="Remove">
				Status
			</Tag>,
		);
		expect(container.firstChild).toMatchSnapshot();
	});
});
