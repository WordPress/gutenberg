import { createElement } from '@wordpress/element';
import { render, screen } from '@testing-library/react';
import { textColor } from '../index';

jest.mock( '@wordpress/block-editor', () => {
	const {
		createElement: mockCreateElement,
	} = require( '@wordpress/element' );

	return {
		...jest.requireActual( '@wordpress/block-editor' ),
		useSettings: () => [
			true,
			[ { color: '#3858e9', name: 'vivid-cyan-blue' } ],
		],
		RichTextToolbarButton: ( { title, onClick } ) =>
			mockCreateElement(
				'button',
				{
					type: 'button',
					onClick,
				},
				title
			),
	};
} );

const TextColorEdit = textColor.edit;

describe( 'TextColorEdit', () => {
	it( 'does not crash when contentRef is null with background-only highlight active', () => {
		render(
			createElement( TextColorEdit, {
				value: {
					text: 'Hello',
					formats: [
						[
							{
								type: 'core/text-color',
								attributes: {
									style: 'background-color:#3858e9',
								},
							},
						],
					],
				},
				onChange: () => {},
				isActive: true,
				activeAttributes: {
					style: 'background-color:#3858e9',
				},
				contentRef: { current: null },
			} )
		);

		expect(
			screen.getByRole( 'button', { name: 'Highlight' } )
		).toBeInTheDocument();
	} );
} );
