import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { Text } from '../';

describe( 'Text', () => {
	test( 'should render correctly', async () => {
		await render( <Text>Lorem ipsum.</Text> );
		const text = screen.getByText( 'Lorem ipsum.' );
		const style = getComputedStyle( text );
		expect( text.tagName ).toBe( 'SPAN' );
		expect( text ).toHaveClass( 'components-text', 'components-truncate' );
		expect( text ).toHaveAttribute( 'data-wp-component', 'Text' );
		expect( text ).toHaveAttribute( 'data-wp-c16t', 'true' );
		expect( style.fontSize ).toBe( '13px' );
		expect( style.fontWeight ).toBe( '400' );
		expect( style.lineHeight ).toBe( '18.2px' );
		expect( style.margin ).toBe( '0px' );
		expect( style.textWrap ).toBe( 'pretty' );
	} );

	test( 'should render optimizeReadabilityFor', async () => {
		await render(
			<Text role="heading" optimizeReadabilityFor="blue">
				Lorem ipsum.
			</Text>
		);
		expect( getComputedStyle( screen.getByRole( 'heading' ) ).color ).toBe(
			'rgb(255, 255, 255)'
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
		).toBe( '20px' );
	} );

	test( 'should render custom size', async () => {
		await render(
			<Text role="heading" size={ 15 }>
				Lorem ipsum.
			</Text>
		);
		expect(
			getComputedStyle( screen.getByRole( 'heading' ) ).fontSize
		).toBe( '15px' );
	} );

	test( 'should render variant', async () => {
		await render(
			<Text role="heading" variant="muted">
				Lorem ipsum.
			</Text>
		);
		expect( getComputedStyle( screen.getByRole( 'heading' ) ).color ).toBe(
			'rgb(112, 112, 112)'
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

	test( 'should prefer the variant color over the color prop', async () => {
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
			'rgb(112, 112, 112)'
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
		expect(
			screen.queryByText( 'ipsum', { selector: 'mark' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent(
			'Lorem ipsum.'
		);
	} );

	test.each( [
		{
			description: 'regular-expression matches',
			text: 'cat c.t',
			words: [ 'c.t' ],
			highlights: [ 'cat', 'c.t' ],
		},
		{
			description: 'literal matches when escaping is enabled',
			text: 'cat c.t',
			words: [ 'c.t' ],
			escape: true,
			highlights: [ 'c.t' ],
		},
		{
			description: 'original text when matching sanitized words',
			text: 'café cafe',
			words: [ 'cafe' ],
			sanitize: ( text: string ) =>
				text.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' ),
			highlights: [ 'café', 'cafe' ],
		},
	] )(
		'preserves $description',
		async ( { text, words, escape, sanitize, highlights } ) => {
			await render(
				<Text
					as="p"
					highlightWords={ words }
					highlightEscape={ escape }
					highlightSanitize={ sanitize }
				>
					{ text }
				</Text>
			);

			expect( screen.getByRole( 'paragraph' ) ).toHaveTextContent( text );
			expect(
				screen
					.queryAllByText( /.+/, { selector: 'mark' } )
					.map( ( mark ) => mark.textContent )
			).toEqual( highlights );
		}
	);

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

	test.each( [
		{ lineHeight: 1.5, expected: '19.5px' },
		{ adjustLineHeightForInnerControls: 'medium', expected: '44px' },
		{ adjustLineHeightForInnerControls: 'large', expected: '51.2px' },
		{ adjustLineHeightForInnerControls: 'small', expected: '36.8px' },
		{ adjustLineHeightForInnerControls: 'xSmall', expected: '29.6px' },
		{
			adjustLineHeightForInnerControls: 'large',
			lineHeight: 1.5,
			expected: '19.5px',
		},
		{
			adjustLineHeightForInnerControls: 'large',
			lineHeight: '32px',
			expected: '32px',
		},
	] as const )(
		'should render lineHeight as $expected for %j',
		async ( { expected, ...props } ) => {
			await render(
				<Text role="heading" { ...props }>
					Lorem ipsum.
				</Text>
			);
			expect(
				getComputedStyle( screen.getByRole( 'heading' ) ).lineHeight
			).toBe( expected );
		}
	);

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
