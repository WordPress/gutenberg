/**
 * External dependencies
 */
import { mount, shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Card from '../';
import CardBody from '../body';
import CardDivider from '../divider';
import CardFooter from '../footer';
import CardHeader from '../header';
import CardMedia from '../media';

describe( 'Card', () => {
	describe( 'basic rendering', () => {
		test( 'should have components-card className', () => {
			const wrapper = shallow( <Card /> );
			const card = wrapper.find( '.components-card' );

			expect( card.length ).toBeTruthy();
		} );

		test( 'should be able to render content', () => {
			const card = shallow(
				<Card>
					<div className="content">Hello</div>
				</Card>
			);
			const content = card.find( '.content' );

			expect( content.length ).toBe( 1 );
			expect( content.text() ).toBe( 'Hello' );
		} );
	} );

	describe( 'variants', () => {
		test( 'should render borderless variant', () => {
			const wrapper = shallow( <Card variant="borderless" /> );
			const card = wrapper.find( '.components-card' );

			expect( card.hasClass( 'is-variant-borderless' ) ).toBe( true );
		} );

		test( 'should render raised variant', () => {
			const wrapper = shallow( <Card variant="raised" /> );
			const card = wrapper.find( '.components-card' );

			expect( card.hasClass( 'is-variant-raised' ) ).toBe( true );
		} );
	} );

	describe( 'CardBody', () => {
		test( 'should be able to render', () => {
			const card = mount(
				<Card>
					<CardBody>Hello</CardBody>
				</Card>
			);
			const cardBody = card.find( 'CardBody' );

			expect( cardBody.length ).toBe( 1 );
			expect( cardBody.text() ).toBe( 'Hello' );
		} );

		test( 'should receive modifier props from context', () => {
			const card = mount(
				<Card size="extraSmall">
					<CardBody>Hello</CardBody>
				</Card>
			);
			const cardBody = card.find( '.components-card__body' ).first();

			expect( cardBody.hasClass( 'is-size-extraSmall' ) ).toBe( true );
		} );

		test( 'should be able to override props from context', () => {
			const card = mount(
				<Card size="extraSmall">
					<CardBody size="large">Hello</CardBody>
				</Card>
			);
			const cardBody = card.find( '.components-card__body' ).first();

			expect( cardBody.hasClass( 'is-size-large' ) ).toBe( true );
		} );
	} );

	describe( 'CardHeader', () => {
		test( 'should be able to render', () => {
			const card = mount(
				<Card>
					<CardHeader>Hello</CardHeader>
				</Card>
			);
			const cardHeader = card.find( 'CardHeader' );

			expect( cardHeader.length ).toBe( 1 );
			expect( cardHeader.text() ).toBe( 'Hello' );
		} );

		test( 'should receive modifier props from context', () => {
			const card = mount(
				<Card size="extraSmall" variant="borderless">
					<CardHeader>Hello</CardHeader>
				</Card>
			);
			const cardHeader = card.find( '.components-card__header' ).first();

			expect( cardHeader.hasClass( 'is-size-extraSmall' ) ).toBe( true );
			expect( cardHeader.hasClass( 'is-variant-borderless' ) ).toBe( true );
		} );

		test( 'should be able to override props from context', () => {
			const card = mount(
				<Card size="extraSmall" variant="borderless">
					<CardHeader size="large" variant="raised">
						Hello
					</CardHeader>
				</Card>
			);
			const cardHeader = card.find( '.components-card__header' ).first();

			expect( cardHeader.hasClass( 'is-size-large' ) ).toBe( true );
			expect( cardHeader.hasClass( 'is-variant-raised' ) ).toBe( true );
		} );
	} );

	describe( 'CardFooter', () => {
		test( 'should be able to render', () => {
			const card = mount(
				<Card>
					<CardFooter>Hello</CardFooter>
				</Card>
			);
			const cardFooter = card.find( 'CardFooter' );

			expect( cardFooter.length ).toBe( 1 );
			expect( cardFooter.text() ).toBe( 'Hello' );
		} );

		test( 'should receive modifier props from context', () => {
			const card = mount(
				<Card size="extraSmall" variant="borderless">
					<CardFooter>Hello</CardFooter>
				</Card>
			);
			const cardFooter = card.find( '.components-card__footer' ).first();

			expect( cardFooter.hasClass( 'is-size-extraSmall' ) ).toBe( true );
			expect( cardFooter.hasClass( 'is-variant-borderless' ) ).toBe( true );
		} );

		test( 'should be able to override props from context', () => {
			const card = mount(
				<Card size="extraSmall" variant="borderless">
					<CardFooter size="large" variant="raised">
						Hello
					</CardFooter>
				</Card>
			);
			const cardFooter = card.find( '.components-card__footer' ).first();

			expect( cardFooter.hasClass( 'is-size-large' ) ).toBe( true );
			expect( cardFooter.hasClass( 'is-variant-raised' ) ).toBe( true );
		} );
	} );

	describe( 'CardDivider', () => {
		test( 'should be able to render', () => {
			const card = mount(
				<Card>
					<CardDivider />
				</Card>
			);
			const cardBody = card.find( 'CardDivider' );

			expect( cardBody.length ).toBe( 1 );
		} );
	} );

	describe( 'CardMedia', () => {
		test( 'should be able to render', () => {
			const card = mount(
				<Card>
					<CardMedia />
				</Card>
			);
			const cardBody = card.find( 'CardMedia' );

			expect( cardBody.length ).toBe( 1 );
		} );
	} );
} );
