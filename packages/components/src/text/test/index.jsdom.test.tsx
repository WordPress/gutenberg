import { render, screen } from '@testing-library/react';
import { Text } from '../';

describe( 'Text', () => {
	describe( 'snapshot tests', () => {
		test( 'should render correctly', () => {
			const { container } = render( <Text>Lorem ipsum.</Text> );
			expect( container ).toMatchSnapshot();
		} );
	} );

	test( 'should render truncate', () => {
		render(
			<Text role="heading" truncate limit={ 1 } ellipsizeMode="tail">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'L…' );
	} );

	test( 'should render as another element', () => {
		render(
			<Text role="heading" as="div">
				Lorem ipsum.
			</Text>
		);
		expect( screen.getByRole( 'heading' )?.nodeName ).toBe( 'DIV' );
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
} );
