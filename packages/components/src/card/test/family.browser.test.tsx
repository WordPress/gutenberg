import { cleanup, render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import {
	Card,
	CardBody,
	CardDivider,
	CardFooter,
	CardHeader,
	CardMedia,
} from '../';

const borderColor = 'rgba(0, 0, 0, 0.1)';

afterEach( cleanup );

describe( 'Card styles', () => {
	it.each( [
		{ size: undefined, padding: '16px 24px' },
		{ size: 'none', padding: '0px' },
		{ size: 'xSmall', padding: '8px' },
		{ size: 'extraSmall', padding: '8px' },
		{ size: 'small', padding: '16px' },
		{ size: 'medium', padding: '16px 24px' },
		{ size: 'large', padding: '24px 32px' },
	] as const )(
		'applies $size padding to each section',
		( { size, padding } ) => {
			render(
				<Card size={ size }>
					<CardHeader data-testid="header">Header</CardHeader>
					<CardBody data-testid="body">Body</CardBody>
					<CardFooter data-testid="footer">Footer</CardFooter>
				</Card>
			);

			for ( const section of [ 'header', 'body', 'footer' ] ) {
				expect(
					getComputedStyle( page.getByTestId( section ).element() )
						.padding
				).toBe( padding );
			}
		}
	);

	it.each( [ 'ltr', 'rtl' ] )( 'applies logical padding in %s', ( dir ) => {
		render(
			<Card
				dir={ dir }
				size={ {
					blockStart: 'none',
					blockEnd: 'xSmall',
					inlineStart: 'small',
					inlineEnd: 'large',
				} }
			>
				<CardBody data-testid="body">Body</CardBody>
			</Card>
		);

		const style = getComputedStyle( page.getByTestId( 'body' ).element() );
		expect( style.paddingTop ).toBe( '0px' );
		expect( style.paddingBottom ).toBe( '8px' );
		expect( style.paddingLeft ).toBe( dir === 'ltr' ? '16px' : '32px' );
		expect( style.paddingRight ).toBe( dir === 'ltr' ? '32px' : '16px' );
	} );

	it( 'lets section props override inherited border and size defaults', () => {
		render(
			<Card isBorderless size="large" data-testid="card">
				<CardHeader
					isBorderless={ false }
					size="small"
					data-testid="header"
				>
					Header
				</CardHeader>
				<CardBody size="medium" data-testid="body">
					Body
				</CardBody>
				<CardFooter
					isBorderless={ false }
					size="xSmall"
					data-testid="footer"
					justify="flex-end"
				>
					Footer
				</CardFooter>
			</Card>
		);

		expect(
			getComputedStyle( page.getByTestId( 'card' ).element() ).boxShadow
		).toBe( 'none' );
		const header = getComputedStyle(
			page.getByTestId( 'header' ).element()
		);
		const footer = getComputedStyle(
			page.getByTestId( 'footer' ).element()
		);
		expect( header.borderBottomWidth ).toBe( '1px' );
		expect( header.borderBottomColor ).toBe( borderColor );
		expect( header.padding ).toBe( '16px' );
		expect(
			getComputedStyle( page.getByTestId( 'body' ).element() ).padding
		).toBe( '16px 24px' );
		expect( footer.borderTopWidth ).toBe( '1px' );
		expect( footer.borderTopColor ).toBe( borderColor );
		expect( footer.padding ).toBe( '8px' );
		expect( footer.justifyContent ).toBe( 'flex-end' );
	} );

	it( 'removes section borders while preserving explicit Surface borders', () => {
		render(
			// Source SCSS does not include the build's theme token fallbacks.
			<div
				style={
					{
						/* eslint-disable @wordpress/no-setting-ds-tokens -- The source-SCSS fixture needs the theme values normally supplied by the build. */
						'--wpds-border-width-xs': '1px',
						'--wpds-color-stroke-surface-neutral': '#dbdbdb',
						/* eslint-enable @wordpress/no-setting-ds-tokens */
					} as CSSProperties
				}
			>
				<Card isBorderless borderTop data-testid="card">
					<CardHeader data-testid="header">Header</CardHeader>
					<CardBody>Body</CardBody>
					<CardFooter data-testid="footer">Footer</CardFooter>
				</Card>
			</div>
		);

		const card = getComputedStyle( page.getByTestId( 'card' ).element() );
		expect( card.boxShadow ).toBe( 'none' );
		expect( card.borderTopWidth ).toBe( '1px' );
		expect(
			getComputedStyle( page.getByTestId( 'header' ).element() )
				.borderBottomWidth
		).toBe( '0px' );
		expect(
			getComputedStyle( page.getByTestId( 'footer' ).element() )
				.borderTopWidth
		).toBe( '0px' );
	} );

	it( 'rounds only the outside section corners', () => {
		render(
			<Card>
				<CardHeader data-testid="header">Header</CardHeader>
				<CardBody data-testid="body">Body</CardBody>
				<CardFooter data-testid="footer">Footer</CardFooter>
			</Card>
		);

		expect(
			getComputedStyle( page.getByTestId( 'header' ).element() )
				.borderRadius
		).toBe( '7px 7px 0px 0px' );
		expect(
			getComputedStyle( page.getByTestId( 'body' ).element() )
				.borderRadius
		).toBe( '0px' );
		expect(
			getComputedStyle( page.getByTestId( 'footer' ).element() )
				.borderRadius
		).toBe( '0px 0px 7px 7px' );
	} );

	it.each( [
		{
			name: 'header',
			section: <CardHeader data-testid="section">Header</CardHeader>,
		},
		{
			name: 'body',
			section: <CardBody data-testid="section">Body</CardBody>,
		},
		{
			name: 'footer',
			section: <CardFooter data-testid="section">Footer</CardFooter>,
		},
	] )( 'rounds every corner of a sole $name', ( { section } ) => {
		render( <Card>{ section }</Card> );

		const style = getComputedStyle(
			page.getByTestId( 'section' ).element()
		);
		expect( style.borderRadius ).toBe( '7px' );
		expect( style.borderTopWidth ).toBe( '0px' );
		expect( style.borderBottomWidth ).toBe( '0px' );
	} );

	it.each( [ 'horizontal', 'vertical' ] as const )(
		'retains CardDivider width and color when %s',
		( orientation ) => {
			render(
				<Card style={ { width: 240, height: 100 } }>
					<CardDivider
						orientation={ orientation }
						data-testid="divider"
					/>
				</Card>
			);

			const style = getComputedStyle(
				page.getByTestId( 'divider' ).element()
			);
			expect( style.width ).toBe( '240px' );
			expect( style.display ).toBe( 'block' );
			expect(
				orientation === 'horizontal'
					? style.borderBottomWidth
					: style.borderRightWidth
			).toBe( '1px' );
			expect(
				orientation === 'horizontal'
					? style.borderBottomColor
					: style.borderRightColor
			).toBe( borderColor );
		}
	);

	it( 'fits media to the Card width', () => {
		render(
			<Card style={ { width: 240 } }>
				<CardMedia data-testid="media">
					<img
						data-testid="image"
						alt="Card media"
						src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200'/%3E"
					/>
					<iframe data-testid="frame" title="Card media frame" />
				</CardMedia>
			</Card>
		);

		const media = getComputedStyle( page.getByTestId( 'media' ).element() );
		expect( media.overflow ).toBe( 'hidden' );
		expect( media.borderRadius ).toBe( '7px' );
		for ( const item of [ 'image', 'frame' ] ) {
			const style = getComputedStyle(
				page.getByTestId( item ).element()
			);
			expect( style.display ).toBe( 'block' );
			expect( style.width ).toBe( '240px' );
			expect( style.maxWidth ).toBe( '100%' );
		}
	} );

	it.each( [ false, true ] )(
		'keeps the body height for isScrollable=%s',
		( isScrollable ) => {
			render(
				<Card style={ { height: 200 } }>
					<CardBody isScrollable={ isScrollable } data-testid="body">
						<div style={ { height: 60 } }>Short content</div>
					</CardBody>
				</Card>
			);

			expect(
				page.getByTestId( 'body' ).element().getBoundingClientRect()
					.height
			).toBe( isScrollable ? 200 : 92 );
		}
	);

	it( 'allows the body to scroll overflowing content', () => {
		render(
			<Card style={ { height: 150 } }>
				<CardBody isScrollable data-testid="body">
					<div style={ { height: 400 } }>Long content</div>
				</CardBody>
			</Card>
		);

		const body = page.getByTestId( 'body' ).element();
		expect( body.clientHeight ).toBe( 150 );
		expect( body.scrollHeight ).toBeGreaterThan( body.clientHeight );
		body.scrollTop = 40;
		expect( body.scrollTop ).toBe( 40 );
	} );
} );
