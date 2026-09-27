import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import FontStyleControl from '../index';

const ROBOTO_FLEX = [
	{ fontStyle: 'normal', fontWeight: '100 1000' },
	{ fontStyle: 'oblique 0deg 10deg', fontWeight: '100 1000' },
];

async function renderControl( props ) {
	const onChange = vi.fn();
	await render(
		<FontStyleControl
			value={ undefined }
			onChange={ onChange }
			{ ...props }
		/>
	);
	return onChange;
}

const openStyles = async () => {
	// CustomSelectControl's trigger is a combobox.
	await userEvent.click( screen.getByRole( 'combobox', { name: /style/i } ) );
	return ( await screen.findAllByRole( 'option' ) ).map( ( option ) =>
		option.textContent.trim()
	);
};

describe( 'the styles offered', () => {
	it( 'offers oblique for a face that declares a slant range', async () => {
		await renderControl( { fontFamilyFaces: ROBOTO_FLEX } );
		expect( await openStyles() ).toEqual( [
			'Default',
			'Normal',
			'Oblique',
		] );
	} );

	it( 'offers italic only for a family that has an italic face', async () => {
		await renderControl( {
			fontFamilyFaces: [
				{ fontStyle: 'normal' },
				{ fontStyle: 'italic' },
			],
		} );
		expect( await openStyles() ).toEqual( [
			'Default',
			'Normal',
			'Italic',
		] );
	} );

	it( 'offers neither for a family with one upright face', async () => {
		// The browser can slant this font, but a synthesised slant is not one
		// of the styles the font has.
		await renderControl( { fontFamilyFaces: [ { fontStyle: 'normal' } ] } );
		expect( await openStyles() ).toEqual( [ 'Default', 'Normal' ] );
	} );
} );

describe( 'starting an oblique', () => {
	it( 'leaves the angle out when the face reaches the one CSS means', async () => {
		const onChange = await renderControl( {
			fontFamilyFaces: [ { fontStyle: 'oblique 0deg 20deg' } ],
		} );
		await openStyles();
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Oblique' } )
		);
		expect( onChange ).toHaveBeenCalledWith( 'oblique' );
	} );

	it( 'says the angle when the face stops short of it', async () => {
		// Roboto Flex slants to 10deg, so a bare `oblique`, which means 14deg,
		// would ask for more than the axis has.
		const onChange = await renderControl( {
			fontFamilyFaces: ROBOTO_FLEX,
		} );
		await openStyles();
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Oblique' } )
		);
		expect( onChange ).toHaveBeenCalledWith( 'oblique 10deg' );
	} );
} );

describe( 'the slant control', () => {
	it( 'appears for an oblique, over the range the face declares', async () => {
		await renderControl( {
			value: 'oblique 6deg',
			fontFamilyFaces: ROBOTO_FLEX,
		} );
		const slider = screen.getByRole( 'slider', { name: /slant/i } );
		expect( slider ).toHaveAttribute( 'min', '0' );
		expect( slider ).toHaveAttribute( 'max', '10' );
		expect(
			screen.getByRole( 'spinbutton', { name: /slant/i } )
		).toHaveValue( 6 );
	} );

	it( 'shows a bare oblique at the angle the face can reach', async () => {
		await renderControl( {
			value: 'oblique',
			fontFamilyFaces: ROBOTO_FLEX,
		} );
		expect(
			screen.getByRole( 'spinbutton', { name: /slant/i } )
		).toHaveValue( 10 );
	} );

	it( 'is absent for a style that is not oblique', async () => {
		await renderControl( {
			value: 'italic',
			fontFamilyFaces: [ { fontStyle: 'italic' } ],
		} );
		expect(
			screen.queryByRole( 'slider', { name: /slant/i } )
		).not.toBeInTheDocument();
	} );
} );
