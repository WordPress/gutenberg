import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import type { ComponentPropsWithoutRef } from 'react';
import { createRef, forwardRef } from '@wordpress/element';
import InputControlPrefixWrapper from '../input-prefix-wrapper';
import InputControlSuffixWrapper from '../input-suffix-wrapper';
import type { PrefixSuffixWrapperProps } from '../types';

const CustomTarget = forwardRef<
	HTMLSpanElement,
	ComponentPropsWithoutRef< 'span' > &
		Pick< PrefixSuffixWrapperProps, 'size' | 'variant' > & {
			isPrefix?: boolean;
		}
>( ( { size, variant, isPrefix, ...props }, ref ) => (
	<span
		{ ...props }
		ref={ ref }
		data-size={ size }
		data-variant={ variant }
		data-prefix={ String( isPrefix ) }
	/>
) );

it.each( [
	{ name: 'prefix', Component: InputControlPrefixWrapper },
	{ name: 'suffix', Component: InputControlSuffixWrapper },
] )(
	'preserves the $name wrapper element, ref, and consumer props',
	async ( { name, Component } ) => {
		const ref = createRef< HTMLSpanElement >();
		await render(
			<Component
				as="span"
				ref={ ref }
				title="Wrapper"
				className="consumer"
				style={ { paddingInlineEnd: 7 } }
			>
				{ name }
			</Component>
		);
		const wrapper = screen.getByText( name );
		expect( wrapper.tagName ).toBe( 'SPAN' );
		expect( ref.current ).toBe( wrapper );
		expect( wrapper ).toHaveAttribute( 'title', 'Wrapper' );
		expect( wrapper ).toHaveClass( 'consumer' );
		expect( wrapper ).toHaveStyle( { paddingInlineEnd: '7px' } );
	}
);

it.each( [
	{
		name: 'prefix',
		Component: InputControlPrefixWrapper,
		expectedPrefix: 'true',
	},
	{
		name: 'suffix',
		Component: InputControlSuffixWrapper,
		expectedPrefix: 'undefined',
	},
] )(
	'forwards size and variant to a custom $name target',
	async ( { name, Component, expectedPrefix } ) => {
		const ref = createRef< HTMLSpanElement >();
		await render(
			<Component
				as={ CustomTarget }
				size="small"
				variant="control"
				ref={ ref }
			>
				{ name }
			</Component>
		);
		const wrapper = screen.getByText( name );
		expect( ref.current ).toBe( wrapper );
		expect( wrapper ).toHaveAttribute( 'data-size', 'small' );
		expect( wrapper ).toHaveAttribute( 'data-variant', 'control' );
		expect( wrapper ).toHaveAttribute( 'data-prefix', expectedPrefix );
	}
);
