/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useGetNewImages from '../use-get-new-images';

const TestComponent = ( { images, imageData } ) => {
	const newImages = useGetNewImages( images, imageData );
	return <div title="testResult">{ JSON.stringify( newImages ) }</div>;
};

describe( 'gallery block useGetNewImages hook', () => {
	it( 'returns null if no images currently in the gallery', () => {
		render( <TestComponent images={ [] } imageData={ [] } /> );
		expect( screen.getByTitle( 'testResult' ) ).toHaveTextContent( 'null' );
	} );

	it( 'should not return images that have been loaded from the saved post content', () => {
		render(
			<TestComponent
				images={ [
					{ clientId: 'abc123', id: 1, fromSavedContent: true },
				] }
				imageData={ [ { id: 1 } ] }
			/>
		);
		expect( screen.getByTitle( 'testResult' ) ).toHaveTextContent( 'null' );
	} );

	it( 'returns array of new images that have been added since the last render', () => {
		const { rerender } = render(
			<TestComponent
				images={ [ { clientId: 'abc123', id: 1 } ] }
				imageData={ [ { id: 1 } ] }
			/>
		);

		expect( screen.getByTitle( 'testResult' ) ).toHaveTextContent(
			'[{"clientId":"abc123","id":1}]'
		);

		rerender(
			<TestComponent
				images={ [
					{ clientId: 'abc123', id: 1 },
					{ clientId: 'efg456', id: 2 },
				] }
				imageData={ [ { id: 1 }, { id: 2 } ] }
			/>
		);

		expect( screen.getByTitle( 'testResult' ) ).toHaveTextContent(
			'[{"clientId":"efg456","id":2}]'
		);
	} );

	it( 'sees an image as new if it has been deleted and added again', () => {
		const { rerender } = render(
			<TestComponent
				images={ [
					{ clientId: 'abc123', id: 1 },
					{ clientId: 'efg456', id: 2 },
				] }
				imageData={ [ { id: 1 }, { id: 2 } ] }
			/>
		);

		rerender(
			<TestComponent
				images={ [ { clientId: 'abc123', id: 1 } ] }
				imageData={ [ { id: 1 } ] }
			/>
		);

		rerender(
			<TestComponent
				images={ [
					{ clientId: 'abc123', id: 1 },
					{ clientId: 'efg456', id: 2 },
				] }
				imageData={ [ { id: 1 }, { id: 2 } ] }
			/>
		);

		expect( screen.getByTitle( 'testResult' ) ).toHaveTextContent(
			'[{"clientId":"efg456","id":2}]'
		);
	} );
} );
