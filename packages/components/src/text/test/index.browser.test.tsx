import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { getFontSize } from '../../utils/font-size';
import { COLORS } from '../../utils';
import { Text } from '../';

function resolveStyle( property: 'color' | 'fontSize', value: string ) {
	const element = document.createElement( 'div' );
	element.style[ property ] = value;
	document.body.appendChild( element );
	const resolved = getComputedStyle( element )[ property ];
	element.remove();
	return resolved;
}

describe( 'Text', () => {
	test( 'should render correctly', async () => {
		await render( <Text>Lorem ipsum.</Text> );
		expect( screen.getByText( 'Lorem ipsum.' ) ).toBeInTheDocument();
	} );

	test( 'should render optimizeReadabilityFor', async () => {
		await render(
			<Text role="heading" optimizeReadabilityFor="blue">
				Lorem ipsum.
			</Text>
		);
		expect( getComputedStyle( screen.getByRole( 'heading' ) ).color ).toBe(
			resolveStyle( 'color', COLORS.white )
		);
	} );

	test( 'should render truncate', async () => {
		await render(
			<Text role="heading" truncate limit={ 1 } ellipsizeMode="tail">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'L…' );
	} );

	test( 'should render size', async () => {
		await render(
			<Text role="heading" size="title">
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).fontSize
		).toBe( resolveStyle( 'fontSize', getFontSize( 'title' ) ) );
	} );

	test( 'should render custom size', async () => {
		await render(
			<Text role="heading" size={ 15 }>
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).fontSize
		).toBe( resolveStyle( 'fontSize', getFontSize( 15 ) ) );
	} );

	test( 'should render variant', async () => {
		await render(
			<Text role="heading" variant="muted">
				Lorem ipsum.
			</Text>
		);
		expect( getComputedStyle( screen.getByRole( 'heading' ) ).color ).toBe(
			resolveStyle( 'color', COLORS.theme.gray[ 700 ] )
		);
	} );

	test( 'should render as another element', async () => {
		await render(
			<Text role="heading" as="div">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' )?.nodeName ).toBe( 'DIV' );
	} );

	test( 'should render align', async () => {
		await render(
			<>
				<Text role="heading" align="center">
					Lorem ipsum.
				</Text>
				<Text role="note">Lorem ipsum.</Text>
			</>
		);

		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).textAlign
		).toBe( 'center' );
		expect(
			getComputedStyle( screen.getByRole( 'note' ) ).textAlign
		).not.toBe( 'center' );
	} );

	test( 'should render color', async () => {
		await render(
			<Text role="heading" color="orange">
				Lorem ipsum.
			</Text>
		);
		expect( getComputedStyle( screen.getByRole( 'heading' ) ).color ).toBe(
			'rgb(255, 165, 0)'
		);
	} );

	test( 'should render variant color regardless of Emotion insertion order', async () => {
		await render(
			<>
				<Text role="note" variant="muted">
					Primer.
				</Text>
				<Text role="heading" color="orange" variant="muted">
					Lorem ipsum.
				</Text>
			</>
		);

		expect( getComputedStyle( screen.getByRole( 'heading' ) ).color ).toBe(
			resolveStyle( 'color', COLORS.theme.gray[ 700 ] )
		);
	} );

	test( 'should render display', async () => {
		await render(
			<Text role="heading" display="inline-flex">
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).display
		).toBe( 'inline-flex' );
	} );

	test( 'should render highlighted words', async () => {
		await render(
			<Text role="heading" highlightWords={ [ 'm' ] }>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' )?.childNodes ).toHaveLength( 5 );
		const words = await screen.findAllByText( 'm' );
		expect( words ).toHaveLength( 2 );
		words.forEach( ( word ) => expect( word.tagName ).toEqual( 'MARK' ) );
	} );

	test( 'should render highlighted words with undefined passed', async () => {
		await render(
			<Text role="heading" highlightWords={ undefined }>
				Lorem ipsum.
			</Text>
		);
		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered.
		expect( screen.getByRole( 'heading' )?.childNodes ).toHaveLength( 1 );
	} );

	test( 'should render highlighted words with highlightCaseSensitive', async () => {
		await render(
			<Text
				role="heading"
				highlightCaseSensitive
				highlightWords={ [ 'IPSUM' ] }
			>
				Lorem ipsum.
			</Text>
		);

		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered.
		expect( screen.getByRole( 'heading' )?.childNodes ).toHaveLength( 1 );
		expect( screen.queryByText( 'IPSUM' ) ).not.toBeInTheDocument();
	} );

	test( 'should render isBlock', async () => {
		await render(
			<Text role="heading" isBlock>
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).display
		).toBe( 'block' );
	} );

	test( 'should render lineHeight', async () => {
		await render(
			<Text role="heading" lineHeight={ 1.5 }>
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).lineHeight
		).toBe( '19.5px' );
	} );

	test( 'should render upperCase', async () => {
		await render(
			<Text role="heading" upperCase>
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).textTransform
		).toBe( 'uppercase' );
	} );

	test( 'should render weight', async () => {
		await render(
			<Text role="heading" weight={ 700 }>
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).fontWeight
		).toBe( '700' );
	} );
} );
