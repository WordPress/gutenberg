/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { symbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useBlockDisplayInformation from '../';
import { isIsolatedEditorKey } from '../../../store/private-keys';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( value ) => ( {
		registerPrivateActions: jest.fn(),
		registerPrivateSelectors: jest.fn(),
		...value,
	} ),
} ) );

const groupIcon = 'group-icon';

function TestComponent( { onChange } ) {
	const blockInformation = useBlockDisplayInformation( 'client-id' );
	useEffect( () => {
		onChange( blockInformation );
	}, [ blockInformation, onChange ] );
	return null;
}

function setupUseSelect( {
	attributes = {
		anchor: 'hero',
		metadata: {
			name: 'Hero pattern',
			patternName: 'theme/hero',
		},
		style: {
			position: {
				type: 'sticky',
			},
		},
	},
	blockName = 'core/group',
	blockType = {
		name: 'core/group',
		title: 'Group',
		icon: groupIcon,
		description: 'Gather blocks in a layout container.',
	},
	getActiveBlockVariation = () => null,
	settings = {},
	isWithinEditedSection = false,
} = {} ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getBlockName: () => blockName,
			getBlockAttributes: () => attributes,
			getSettings: () => settings,
			__experimentalGetParsedPattern: () => ( {
				title: 'Hero pattern',
				description: 'Pattern description.',
			} ),
			isWithinEditedContentOnlySection: () => isWithinEditedSection,
			getBlockType: () => blockType,
			getActiveBlockVariation,
		} ) )
	);
}

describe( 'useBlockDisplayInformation', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'displays pattern information for a pattern section that is not being edited', () => {
		setupUseSelect();
		const onChange = jest.fn();

		render( <TestComponent onChange={ onChange } /> );

		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: 'Pattern',
				icon: symbol,
				description: 'Pattern description.',
				name: 'Hero pattern',
			} )
		);
	} );

	it( 'displays block information for a pattern section that is being edited', () => {
		setupUseSelect( { isWithinEditedSection: true } );
		const onChange = jest.fn();

		render( <TestComponent onChange={ onChange } /> );

		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: 'Group',
				icon: groupIcon,
				description: 'Gather blocks in a layout container.',
				name: 'Hero pattern',
			} )
		);
	} );

	it( 'displays block information for a pattern wrapper in an isolated editor', () => {
		setupUseSelect( {
			attributes: {
				metadata: {
					name: 'Header',
					patternName: 'theme/header-wrapper',
				},
			},
			settings: {
				[ isIsolatedEditorKey ]: true,
			},
		} );
		const onChange = jest.fn();

		render( <TestComponent onChange={ onChange } /> );

		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: 'Group',
				icon: groupIcon,
				description: 'Gather blocks in a layout container.',
				name: 'Header',
			} )
		);
	} );
} );
