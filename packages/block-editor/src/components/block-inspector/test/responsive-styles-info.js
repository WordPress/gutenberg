import { render, screen } from '@testing-library/react';
import ResponsiveStylesInfo from '../responsive-styles-info';

let mockAttributes;
let mockResponsiveStylesLabel;

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( callback ) =>
		callback( () => ( {
			getBlockAttributes: () => mockAttributes,
		} ) ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Icon: () => <span />,
	__experimentalText: ( { children } ) => <span>{ children }</span>,
	__experimentalHStack: ( { children } ) => <div>{ children }</div>,
	privateApis: {
		Badge: ( { children } ) => <div>{ children }</div>,
	},
} ) );

jest.mock( '@wordpress/icons', () => ( {
	mobile: 'mobile',
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( value ) => value,
} ) );

jest.mock( '../../../store', () => ( {
	store: 'core/block-editor',
} ) );

jest.mock( '../../../hooks/block-style-state', () => ( {
	getResponsiveStylesLabel: () => mockResponsiveStylesLabel,
} ) );

describe( 'ResponsiveStylesInfo', () => {
	it( 'shows no status when the block has no responsive styles', () => {
		mockAttributes = { style: { color: { text: '#000000' } } };
		mockResponsiveStylesLabel = null;

		const { container } = render(
			<ResponsiveStylesInfo clientId="block-1" />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows the viewports with responsive styles', () => {
		mockAttributes = {
			style: {
				'@tablet': { spacing: { padding: { top: '20px' } } },
				'@mobile': { color: { text: '#ff0000' } },
			},
		};
		mockResponsiveStylesLabel =
			'Block has responsive styles for Tablet, Mobile.';

		render( <ResponsiveStylesInfo clientId="block-1" /> );

		expect(
			screen.getByText(
				'Block has responsive styles for Tablet, Mobile.'
			)
		).toBeVisible();
	} );
} );
