import { render, screen } from '@testing-library/react';
import withInstanceId from '../';

describe( 'withInstanceId', () => {
	const DumpComponent = withInstanceId( ( { instanceId } ) => {
		return <div data-testid="wrapper">{ instanceId }</div>;
	} );

	it( 'should generate a new instanceId for each instance', () => {
		render( <DumpComponent /> );
		render( <DumpComponent /> );

		const elements = screen.getAllByTestId( 'wrapper' );

		expect( elements[ 0 ] ).not.toHaveTextContent(
			elements[ 1 ].textContent
		);
	} );
} );
