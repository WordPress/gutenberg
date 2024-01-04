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
import { Composite, CompositeRow, CompositeItem, useCompositeStore } from '..';

type InitialState = Parameters< typeof useCompositeStore >[ 0 ];

const Placeholder = ( _: InitialState ) => <></>;

const meta: Meta< typeof Placeholder > = {
	title: 'Components/Composite/Composite (New)',
	id: 'components-composite-new',
	component: Placeholder,
};
export default meta;

export const Default: StoryFn< typeof Composite > = ( { ...initialState } ) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...initialState } );

	return (
		<Composite store={ store } aria-label="Ariakit Composite">
			<CompositeRow>
				<CompositeItem>Item A1</CompositeItem>
				<CompositeItem>Item A2</CompositeItem>
				<CompositeItem>Item A3</CompositeItem>
			</CompositeRow>
			<CompositeRow>
				<CompositeItem>Item B1</CompositeItem>
				<CompositeItem>Item B2</CompositeItem>
				<CompositeItem>Item B3</CompositeItem>
			</CompositeRow>
			<CompositeRow>
				<CompositeItem>Item C1</CompositeItem>
				<CompositeItem>Item C2</CompositeItem>
				<CompositeItem>Item C3</CompositeItem>
			</CompositeRow>
		</Composite>
	);
};
