/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { getFontSize } from '../../utils/font-size';
import { COLORS } from '../../utils';
import { Text } from '../';

describe( 'Text', () => {
	describe( 'snapshot tests', () => {
		test( 'should render correctly', () => {
			const { container } = render( <Text>Lorem ipsum.</Text> );
			expect( container ).toMatchSnapshot();
		} );
	} );

	test( 'should render optimizeReadabilityFor', () => {
		render(
			<Text role="heading" optimizeReadabilityFor="blue">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			color: COLORS.white,
		} );
	} );

	test( 'should render truncate', () => {
		render(
			<Text role="heading" truncate>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			textOverflow: 'ellipsis',
		} );
	} );

	test( 'should render size', () => {
		render(
			<Text role="heading" size="title">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			fontSize: getFontSize( 'title' ),
		} );
	} );

	test( 'should render custom size', () => {
		render(
			<Text role="heading" size={ 15 }>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			fontSize: getFontSize( 15 ),
		} );
	} );

	test( 'should render variant', () => {
		render(
			<Text role="heading" variant="muted">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			color: COLORS.gray[ 700 ],
		} );
	} );

	test( 'should render as another element', () => {
		render(
			<Text role="heading" as="div">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' )?.nodeName ).toBe( 'DIV' );
	} );

	test( 'should render align', () => {
		render(
			<>
				<Text role="heading" align="center">
					Lorem ipsum.
				</Text>
				<Text role="note">Lorem ipsum.</Text>
			</>
		);

		expect( screen.getByRole( 'note' ) ).toMatchStyleDiffSnapshot(
			screen.getByRole( 'heading' )
		);
	} );

	test( 'should render color', () => {
		render(
			<Text role="heading" color="orange">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			color: 'rgb(255, 165, 0)',
		} );
	} );

	test( 'should render display', () => {
		render(
			<Text role="heading" display="inline-flex">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			display: 'inline-flex',
		} );
	} );

	test( 'should render highlighted words', async () => {
		render(
			<Text role="heading" highlightWords={ [ 'm' ] }>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' )?.childNodes ).toHaveLength( 5 );
		const words = await screen.findAllByText( 'm' );
		expect( words ).toHaveLength( 2 );
		words.forEach( ( word ) => expect( word.tagName ).toEqual( 'MARK' ) );
	} );

	test( 'should render highlighted words with undefined passed', () => {
		render(
			<Text role="heading" highlightWords={ undefined }>
				Lorem ipsum.
			</Text>
		);
		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered.
		expect( screen.getByRole( 'heading' )?.childNodes ).toHaveLength( 1 );
	} );

	test( 'should render highlighted words with highlightCaseSensitive', () => {
		const { container } = render(
			<Text
				role="heading"
				highlightCaseSensitive
				highlightWords={ [ 'IPSUM' ] }
			>
				Lorem ipsum.
			</Text>
		);

		expect( container ).toMatchSnapshot();
		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered.
		expect( screen.getByRole( 'heading' )?.childNodes ).toHaveLength( 1 );
	} );

	test( 'should render isBlock', () => {
		render(
			<Text role="heading" isBlock>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			display: 'block',
		} );
	} );

	test( 'should render lineHeight', () => {
		render(
			<Text role="heading" lineHeight={ 1.5 }>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			lineHeight: '1.5',
		} );
	} );

	test( 'should render upperCase', () => {
		render(
			<Text role="heading" upperCase>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			textTransform: 'uppercase',
		} );
	} );

	test( 'should render weight', () => {
		render(
			<Text role="heading" weight={ 700 }>
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveStyle( {
			fontWeight: '700',
		} );
	} );
} );
