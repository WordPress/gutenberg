import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
	Card,
	CardBody,
	CardDivider,
	CardFooter,
	CardHeader,
	CardMedia,
} from '../';
import { useCx } from '../../utils/hooks/use-cx';
import * as styles from '../styles';

function EmotionStylePrimer( {
	styleFragment,
}: {
	styleFragment: Parameters< ReturnType< typeof useCx > >[ 0 ];
} ) {
	const cx = useCx();

	return <div className={ cx( styleFragment ) } />;
}

function expectComposedEmotionClassName(
	element: HTMLElement,
	styleLabels: string[]
) {
	const matchingClassNames = element.className
		.split( /\s+/ )
		.filter( ( className ) => className.startsWith( 'css-' ) )
		.filter( ( className ) =>
			styleLabels.some( ( styleLabel ) =>
				className.includes( styleLabel )
			)
		);

	expect( matchingClassNames ).toHaveLength( 1 );
	for ( const styleLabel of styleLabels ) {
		expect( matchingClassNames[ 0 ] ).toEqual(
			expect.stringContaining( styleLabel )
		);
	}
}

const spacingProperties = [
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
] as const;

function pickStyles(
	element: Element,
	properties: readonly ( keyof CSSStyleDeclaration )[]
) {
	const computed = getComputedStyle( element );
	return Object.fromEntries(
		properties.map( ( property ) => [ property, computed[ property ] ] )
	);
}

describe( 'Card', () => {
	it( 'renders its regions and media', () => {
		render(
			<Card>
				<CardHeader>Card Header</CardHeader>
				<CardBody>Card Body</CardBody>
				<CardDivider />
				<CardMedia>
					<img alt="Card Media" src="about:blank" />
				</CardMedia>
				<CardFooter>Card Footer</CardFooter>
			</Card>
		);

		expect( screen.getByText( 'Card Header' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Card Body' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'separator' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'img', { name: 'Card Media' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Card Footer' ) ).toBeInTheDocument();
	} );

	it( 'removes the border when isBorderless is true', () => {
		const { rerender } = render(
			<Card data-testid="card-wrapper">Code is Poetry</Card>
		);
		const card = screen.getByTestId( 'card-wrapper' );
		const borderedShadow = getComputedStyle( card ).boxShadow;

		rerender(
			<Card data-testid="card-wrapper" isBorderless>
				Code is Poetry
			</Card>
		);

		expect( borderedShadow ).not.toBe( 'none' );
		expect( getComputedStyle( card ).boxShadow ).toBe( 'none' );
	} );

	it( 'keeps borderless styles regardless of Emotion insertion order', () => {
		render( <EmotionStylePrimer styleFragment={ styles.boxShadowless } /> );
		render(
			<Card data-testid="card-wrapper" isBorderless>
				Code is Poetry
			</Card>
		);

		const card = screen.getByTestId( 'card-wrapper' );
		expectComposedEmotionClassName( card, [ 'Card', 'boxShadowless' ] );
		expect( getComputedStyle( card ).boxShadow ).toBe( 'none' );
	} );

	it( 'adds a rounded border when isRounded is true', () => {
		render(
			<Card data-testid="card-rounded" isRounded>
				Code is Poetry
			</Card>
		);
		render(
			<Card data-testid="card-squared" isRounded={ false }>
				Code is Poetry
			</Card>
		);

		const roundedRadius = getComputedStyle(
			screen.getByTestId( 'card-rounded' )
		).borderTopLeftRadius;
		const squaredRadius = getComputedStyle(
			screen.getByTestId( 'card-squared' )
		).borderTopLeftRadius;

		expect( roundedRadius ).not.toBe( squaredRadius );
		expect( squaredRadius ).toBe( '0px' );
	} );

	it( 'adds a box shadow when elevation is greater than zero', () => {
		render(
			<Card data-testid="elevated" elevation={ 2 }>
				Code is Poetry
			</Card>
		);
		render( <Card data-testid="flat">Code is Poetry</Card> );

		const readElevationShadow = ( card: HTMLElement ) => {
			// The elevation layers are intentionally hidden presentation elements.
			// eslint-disable-next-line testing-library/no-node-access
			const layers = card.querySelectorAll< HTMLElement >(
				'[aria-hidden="true"]'
			);
			return getComputedStyle( layers[ layers.length - 1 ] ).boxShadow;
		};
		expect(
			readElevationShadow( screen.getByTestId( 'elevated' ) )
		).not.toBe( readElevationShadow( screen.getByTestId( 'flat' ) ) );
	} );

	it( 'changes region spacing with the size prop', () => {
		render(
			<Card size="medium">
				<CardHeader data-testid="medium-header">Header</CardHeader>
				<CardBody data-testid="medium-body">Body</CardBody>
			</Card>
		);
		render(
			<Card size="large">
				<CardHeader data-testid="large-header">Header</CardHeader>
				<CardBody data-testid="large-body">Body</CardBody>
			</Card>
		);

		expect(
			pickStyles(
				screen.getByTestId( 'large-header' ),
				spacingProperties
			)
		).not.toEqual(
			pickStyles(
				screen.getByTestId( 'medium-header' ),
				spacingProperties
			)
		);
		expect(
			pickStyles( screen.getByTestId( 'large-body' ), spacingProperties )
		).not.toEqual(
			pickStyles( screen.getByTestId( 'medium-body' ), spacingProperties )
		);
	} );

	it( 'warns when the legacy isElevated prop is passed', () => {
		render( <Card isElevated>Code is Poetry</Card> );

		expect( screen.getByText( 'Code is Poetry' ) ).toBeInTheDocument();
		expect( console ).toHaveWarned();
	} );

	it( 'passes border and size styles from context to its regions', () => {
		render(
			<Card isBorderless size="large">
				<CardHeader data-testid="borderless-large-header">
					Header
				</CardHeader>
				<CardBody data-testid="borderless-large-body">Body</CardBody>
			</Card>
		);
		render(
			<Card isBorderless={ false } size="small">
				<CardHeader data-testid="bordered-small-header">
					Header
				</CardHeader>
				<CardBody data-testid="bordered-small-body">Body</CardBody>
			</Card>
		);

		expect(
			getComputedStyle( screen.getByTestId( 'borderless-large-header' ) )
				.borderBottomStyle
		).toBe( 'none' );
		expect(
			getComputedStyle( screen.getByTestId( 'bordered-small-header' ) )
				.borderBottomStyle
		).not.toBe( 'none' );
		expect(
			pickStyles(
				screen.getByTestId( 'borderless-large-body' ),
				spacingProperties
			)
		).not.toEqual(
			pickStyles(
				screen.getByTestId( 'bordered-small-body' ),
				spacingProperties
			)
		);
	} );

	it( 'lets region props override inherited Card styles', () => {
		render(
			<Card isBorderless size="large">
				<CardHeader data-testid="inherited">Header</CardHeader>
				<CardHeader
					data-testid="overridden"
					isBorderless={ false }
					size="small"
				>
					Header
				</CardHeader>
				<CardBody>Body</CardBody>
			</Card>
		);

		const inherited = screen.getByTestId( 'inherited' );
		const overridden = screen.getByTestId( 'overridden' );

		expect( getComputedStyle( inherited ).borderBottomStyle ).toBe(
			'none'
		);
		expect( getComputedStyle( overridden ).borderBottomStyle ).not.toBe(
			'none'
		);
		expect( pickStyles( inherited, spacingProperties ) ).not.toEqual(
			pickStyles( overridden, spacingProperties )
		);
	} );

	it( 'treats extraSmall as an alias for xSmall', () => {
		render(
			<Card size="xSmall">
				<CardHeader data-testid="xsmall-header">Header</CardHeader>
				<CardBody data-testid="xsmall-body">Body</CardBody>
			</Card>
		);
		render(
			<Card size="extraSmall">
				<CardHeader data-testid="extra-small-header">Header</CardHeader>
				<CardBody data-testid="extra-small-body">Body</CardBody>
			</Card>
		);

		expect(
			pickStyles(
				screen.getByTestId( 'xsmall-header' ),
				spacingProperties
			)
		).toEqual(
			pickStyles(
				screen.getByTestId( 'extra-small-header' ),
				spacingProperties
			)
		);
		expect(
			pickStyles( screen.getByTestId( 'xsmall-body' ), spacingProperties )
		).toEqual(
			pickStyles(
				screen.getByTestId( 'extra-small-body' ),
				spacingProperties
			)
		);
	} );

	it( 'applies the shady background to all Card regions', () => {
		render(
			<>
				<CardHeader data-testid="header">Header</CardHeader>
				<CardHeader data-testid="shady-header" isShady>
					Header
				</CardHeader>
				<CardBody data-testid="body">Body</CardBody>
				<CardBody data-testid="shady-body" isShady>
					Body
				</CardBody>
				<CardFooter data-testid="footer">Footer</CardFooter>
				<CardFooter data-testid="shady-footer" isShady>
					Footer
				</CardFooter>
			</>
		);

		for ( const region of [ 'header', 'body', 'footer' ] ) {
			expect(
				getComputedStyle( screen.getByTestId( `shady-${ region }` ) )
					.backgroundColor
			).not.toBe(
				getComputedStyle( screen.getByTestId( region ) ).backgroundColor
			);
		}
	} );

	it( 'applies CardFooter justification', () => {
		render(
			<CardFooter data-testid="footer" justify="flex-end">
				Footer
			</CardFooter>
		);

		expect(
			getComputedStyle( screen.getByTestId( 'footer' ) ).justifyContent
		).toBe( 'flex-end' );
	} );

	it( 'keeps region borderless styles regardless of Emotion insertion order', () => {
		render( <EmotionStylePrimer styleFragment={ styles.borderless } /> );
		render(
			<Card>
				<CardHeader data-testid="card-header" isBorderless>
					Header
				</CardHeader>
				<CardBody>Body</CardBody>
				<CardFooter data-testid="card-footer" isBorderless>
					Footer
				</CardFooter>
			</Card>
		);

		for ( const testId of [ 'card-header', 'card-footer' ] ) {
			const region = screen.getByTestId( testId );
			expect( getComputedStyle( region ).borderTopStyle ).toBe( 'none' );
		}
	} );

	it( 'makes CardBody scrollable when requested', () => {
		render(
			<CardBody data-testid="scrollable" isScrollable>
				Body
			</CardBody>
		);

		expect(
			getComputedStyle( screen.getByTestId( 'scrollable' ) ).overflowY
		).toBe( 'auto' );
	} );
} );
