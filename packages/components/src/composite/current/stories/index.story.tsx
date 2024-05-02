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
import {
	Composite,
	CompositeGroup,
	CompositeRow,
	CompositeItem,
	useCompositeStore,
} from '..';
import { UseCompositeStorePlaceholder, transform } from './utils';

const meta: Meta< typeof UseCompositeStorePlaceholder > = {
	title: 'Components/Composite (V2)',
	component: UseCompositeStorePlaceholder,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Composite,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CompositeGroup,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CompositeRow,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CompositeItem,
	},
	parameters: {
		badges: [ 'private' ],
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
		<Composite role="grid" store={ store } aria-label="Ariakit Composite">
			<CompositeRow role="row">
				<CompositeItem role="gridcell">Item A1</CompositeItem>
				<CompositeItem role="gridcell">Item A2</CompositeItem>
				<CompositeItem role="gridcell">Item A3</CompositeItem>
			</CompositeRow>
			<CompositeRow role="row">
				<CompositeItem role="gridcell">Item B1</CompositeItem>
				<CompositeItem role="gridcell">Item B2</CompositeItem>
				<CompositeItem role="gridcell">Item B3</CompositeItem>
			</CompositeRow>
			<CompositeRow role="row">
				<CompositeItem role="gridcell">Item C1</CompositeItem>
				<CompositeItem role="gridcell">Item C2</CompositeItem>
				<CompositeItem role="gridcell">Item C3</CompositeItem>
			</CompositeRow>
		</Composite>
	);
};
