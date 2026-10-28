import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { withoutUnusedLayoutClasses } from '../hooks';

function BlockListBlock( { __unstableLayoutClassNames } ) {
	return createElement(
		'div',
		{ 'data-testid': 'block' },
		__unstableLayoutClassNames ?? 'none'
	);
}

function renderBlock( props ) {
	const Wrapped = withoutUnusedLayoutClasses( BlockListBlock );

	render(
		createElement( Wrapped, {
			__unstableLayoutClassNames: 'is-layout-flow',
			attributes: {},
			...props,
		} )
	);

	return screen.getByTestId( 'block' ).textContent;
}

describe( 'withoutUnusedLayoutClasses', () => {
	it( 'drops the layout class names of a Post Terms block with no layout', () => {
		expect( renderBlock( { name: 'core/post-terms' } ) ).toBe( 'none' );
	} );

	it( 'keeps the layout class names once the block has a layout', () => {
		expect(
			renderBlock( {
				name: 'core/post-terms',
				attributes: { layout: { type: 'flex' } },
			} )
		).toBe( 'is-layout-flow' );
	} );

	it( 'leaves other blocks alone', () => {
		expect( renderBlock( { name: 'core/group' } ) ).toBe(
			'is-layout-flow'
		);
	} );
} );
