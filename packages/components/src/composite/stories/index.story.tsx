/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Composite from '..';
import useCompositeStore from '../store';
import { UseCompositeStorePlaceholder, transform } from './utils';

const meta: Meta< typeof UseCompositeStorePlaceholder > = {
	title: 'Components/Composite (V2)',
	component: UseCompositeStorePlaceholder,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Composite,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Group': Composite.Group,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.GroupLabel': Composite.GroupLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Row': Composite.Row,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Item': Composite.Item,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Hover': Composite.Hover,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Typeahead': Composite.Typeahead,
	},
	argTypes: {
		setActiveId: { control: { type: null } },
		focusLoop: {
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical', 'both' ],
		},
		focusWrap: {
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical', 'both' ],
		},
	},
	tags: [ 'status-private' ],
	parameters: {
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			source: { transform },
		},
	},
	decorators: [
		( Story ) => {
			return (
				<>
					{ /* Visually style the active composite item  */ }
					<style>{ `
						[data-active-item] {
							background-color: #ffc0b5;
						}
					` }</style>
					<Story />
					<div
						style={ {
							marginTop: '2em',
							fontSize: '12px',
							fontStyle: 'italic',
						} }
					>
						{ /* eslint-disable-next-line no-restricted-syntax */ }
						<p id="list-title">Notes</p>
						<ul aria-labelledby="list-title">
							<li>
								The active composite item is highlighted with a
								different background color;
							</li>
							<li>
								A composite item can be the active item even
								when it doesn&apos;t have keyboard focus.
							</li>
						</ul>
					</div>
				</>
			);
		},
	],
};
export default meta;

export const Default: StoryFn< typeof UseCompositeStorePlaceholder > = (
	storeProps
) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...storeProps } );

	return (
		<Composite store={ store }>
			<Composite.Item>Item one</Composite.Item>
			<Composite.Item>Item two</Composite.Item>
			<Composite.Item>Item three</Composite.Item>
		</Composite>
	);
};

export const Groups: StoryFn< typeof UseCompositeStorePlaceholder > = (
	storeProps
) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...storeProps } );

	return (
		<Composite store={ store }>
			<Composite.Group>
				<Composite.GroupLabel>Group one</Composite.GroupLabel>
				<Composite.Item>Item 1.1</Composite.Item>
				<Composite.Item>Item 1.2</Composite.Item>
			</Composite.Group>
			<Composite.Group>
				<Composite.GroupLabel>Group two</Composite.GroupLabel>
				<Composite.Item>Item 2.1</Composite.Item>
				<Composite.Item>Item 2.1</Composite.Item>
			</Composite.Group>
		</Composite>
	);
};

export const Grid: StoryFn< typeof UseCompositeStorePlaceholder > = (
	storeProps
) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...storeProps } );

	return (
		<Composite role="grid" store={ store } aria-label="Composite">
			<Composite.Row role="row">
				<Composite.Item role="gridcell">Item A1</Composite.Item>
				<Composite.Item role="gridcell">Item A2</Composite.Item>
				<Composite.Item role="gridcell">Item A3</Composite.Item>
			</Composite.Row>
			<Composite.Row role="row">
				<Composite.Item role="gridcell">Item B1</Composite.Item>
				<Composite.Item role="gridcell">Item B2</Composite.Item>
				<Composite.Item role="gridcell">Item B3</Composite.Item>
			</Composite.Row>
			<Composite.Row role="row">
				<Composite.Item role="gridcell">Item C1</Composite.Item>
				<Composite.Item role="gridcell">Item C2</Composite.Item>
				<Composite.Item role="gridcell">Item C3</Composite.Item>
			</Composite.Row>
		</Composite>
	);
};

export const Hover: StoryFn< typeof UseCompositeStorePlaceholder > = (
	storeProps
) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...storeProps } );

	return (
		<Composite store={ store }>
			<Composite.Hover render={ <Composite.Item /> }>
				Hover item one
			</Composite.Hover>
			<Composite.Hover render={ <Composite.Item /> }>
				Hover item two
			</Composite.Hover>
			<Composite.Hover render={ <Composite.Item /> }>
				Hover item three
			</Composite.Hover>
		</Composite>
	);
};
Hover.parameters = {
	docs: {
		description: {
			story: 'Elements in the composite widget will receive focus on mouse move and lose focus to the composite base element on mouse leave.',
		},
	},
};

export const Typeahead: StoryFn< typeof UseCompositeStorePlaceholder > = (
	storeProps
) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...storeProps } );

	return (
		<Composite store={ store } render={ <Composite.Typeahead /> }>
			<Composite.Item>Apple</Composite.Item>
			<Composite.Item>Banana</Composite.Item>
			<Composite.Item>Peach</Composite.Item>
		</Composite>
	);
};
Typeahead.parameters = {
	docs: {
		description: {
			story: 'When focus in on the composite widget, hitting printable character keys will move focus to the next composite item that begins with the input characters.',
		},
	},
};
