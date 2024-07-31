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
import { Composite, useCompositeStore } from '..';
import { UseCompositeStorePlaceholder, transform } from './utils';

const meta: Meta< typeof UseCompositeStorePlaceholder > = {
	title: 'Components/Composite',
	component: UseCompositeStorePlaceholder,
	subcomponents: {
		// @ts-expect-error Storybook doesn't like overloaded exports as subcomponents
		Composite,
		// @ts-expect-error Storybook doesn't like overloaded exports as subcomponents
		'Composite.Group': Composite.Group,
		// @ts-expect-error Storybook doesn't like overloaded exports as subcomponents
		'Composite.GroupLabel': Composite.GroupLabel,
		// @ts-expect-error Storybook doesn't like overloaded exports as subcomponents
		'Composite.Row': Composite.Row,
		// @ts-expect-error Storybook doesn't like overloaded exports as subcomponents
		'Composite.Item': Composite.Item,
	},
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			source: { transform },
			extractArgTypes: ( component: React.FunctionComponent ) => {
				const name = component.displayName;
				const path = name
					?.replace(
						/([a-z])([A-Z])/g,
						( _, a, b ) => `${ a }-${ b.toLowerCase() }`
					)
					.toLowerCase();
				const url = `https://ariakit.org/reference/${ path }`;
				return {
					props: {
						name: 'Props',
						description: `See <a href="${ url }">Ariakit docs</a> for <code>${ name }</code>`,
						table: { type: { summary: undefined } },
					},
				};
			},
		},
	},
};
export default meta;

export const Default: StoryFn< typeof Composite > = ( { ...initialState } ) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...initialState } );

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
