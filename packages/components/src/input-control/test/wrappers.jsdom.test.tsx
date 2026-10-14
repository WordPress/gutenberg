import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import InputControlPrefixWrapper from '../input-prefix-wrapper';
import InputControlSuffixWrapper from '../input-suffix-wrapper';

it.each( [
	{ name: 'prefix', Component: InputControlPrefixWrapper },
	{ name: 'suffix', Component: InputControlSuffixWrapper },
] )(
	'preserves the $name wrapper element, ref, and consumer props',
	( { name, Component } ) => {
		const ref = createRef< HTMLSpanElement >();
		render(
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
