import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { logged } from '@wordpress/deprecated';
import _Badge from '..';

const DEPRECATION_MESSAGE =
	'wp.components.privateApis.Badge is deprecated since version 7.2. Please use Badge from @wordpress/ui instead. Note: This private API will be completely removed within a few Gutenberg plugin releases.';

const testid = 'my-badge';
const Badge = ( props: React.ComponentProps< typeof _Badge > ) => (
	<_Badge data-testid={ testid } { ...props } />
);

beforeEach( () => {
	logged[ DEPRECATION_MESSAGE ] = true;
} );

describe( 'Shows a deprecation warning', () => {
	it( 'Badge', () => {
		delete logged[ DEPRECATION_MESSAGE ];
		render( <Badge>Code is Poetry</Badge> );

		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
	} );
} );

describe( 'Badge', () => {
	it( 'should render correctly with default props', () => {
		render( <Badge>Code is Poetry</Badge> );
		const badge = screen.getByTestId( testid );
		expect( badge ).toBeInTheDocument();
		expect( badge.tagName ).toBe( 'SPAN' );
		expect( badge ).toHaveClass( 'components-badge' );
	} );

	it( 'should render as per its intent and contain an icon', () => {
		render( <Badge intent="error">Code is Poetry</Badge> );
		const badge = screen.getByTestId( testid );
		expect( badge ).toHaveClass( 'components-badge', 'is-error' );
		expect( badge ).toHaveClass( 'has-icon' );
	} );

	it( 'should combine custom className with default class', () => {
		render( <Badge className="custom-class">Code is Poetry</Badge> );
		const badge = screen.getByTestId( testid );
		expect( badge ).toHaveClass( 'components-badge' );
		expect( badge ).toHaveClass( 'custom-class' );
	} );

	it( 'should pass through additional props', () => {
		render( <Badge data-testid="custom-badge">Code is Poetry</Badge> );
		const badge = screen.getByTestId( 'custom-badge' );
		expect( badge ).toHaveTextContent( 'Code is Poetry' );
		expect( badge ).toHaveClass( 'components-badge' );
	} );
} );
