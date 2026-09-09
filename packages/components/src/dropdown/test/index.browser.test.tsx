import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DropdownContentWrapper } from '../dropdown-content-wrapper';

const paddingProperties = [
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
] as const;

function getPadding( element: Element ) {
	const styles = getComputedStyle( element );
	return paddingProperties.map( ( property ) => styles[ property ] );
}

function renderWrapper( paddingSize?: 'small' | 'medium' | 'none' ) {
	render(
		<DropdownContentWrapper paddingSize={ paddingSize }>
			<span>content</span>
		</DropdownContentWrapper>
	);

	return screen.getByText( 'content' ).parentElement!;
}

describe( 'DropdownContentWrapper', () => {
	it( 'applies the default small padding', () => {
		expect( getPadding( renderWrapper() ) ).toEqual( [
			'8px',
			'8px',
			'8px',
			'8px',
		] );
	} );

	it( 'applies medium padding when paddingSize is "medium"', () => {
		expect( getPadding( renderWrapper( 'medium' ) ) ).toEqual( [
			'16px',
			'16px',
			'16px',
			'16px',
		] );
	} );

	it( 'removes padding when paddingSize is "none"', () => {
		expect( getPadding( renderWrapper( 'none' ) ) ).toEqual( [
			'0px',
			'0px',
			'0px',
			'0px',
		] );
	} );
} );
