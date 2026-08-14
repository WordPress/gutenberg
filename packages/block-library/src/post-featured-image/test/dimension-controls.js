import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import DimensionControls from '../dimension-controls';

function Example( { attributes = {}, setAttributes = () => {} } ) {
	return (
		<ToolsPanel label="Dimensions" panelId="panel-id" resetAll={ () => {} }>
			<DimensionControls
				clientId="panel-id"
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</ToolsPanel>
	);
}

describe( 'PostFeaturedImage dimension controls', () => {
	it( 'offers scale when only a height is set', () => {
		render( <Example attributes={ { height: '200px' } } /> );

		expect(
			screen.getByRole( 'radiogroup', { name: 'Scale' } )
		).toBeInTheDocument();
	} );

	it( 'setting a height on its own keeps the width unset and picks up the default scale', async () => {
		const user = userEvent.setup();
		const setAttributes = jest.fn();

		render( <Example setAttributes={ setAttributes } /> );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Height' } ),
			'200'
		);

		expect( setAttributes ).toHaveBeenLastCalledWith( {
			aspectRatio: undefined,
			width: undefined,
			height: '200px',
			scale: 'cover',
		} );
	} );
} );
