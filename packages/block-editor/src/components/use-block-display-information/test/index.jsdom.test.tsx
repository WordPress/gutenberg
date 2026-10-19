import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { symbol } from '@wordpress/icons';
import useBlockDisplayInformation from '../';
import type { unlock } from '../../../lock-unlock';
import type { BlockDisplayAttributes, BlockDisplayInformation } from '../types';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );
vi.mock( import( '../../../lock-unlock' ), () => ( {
	// Returns the selectors themselves, with the private ones mixed in.
	unlock: ( ( value: object ) => ( {
		registerPrivateActions: vi.fn(),
		registerPrivateSelectors: vi.fn(),
		...value,
	} ) ) as typeof unlock,
} ) );

const groupIcon = 'group-icon';
const templatePartIcon = 'template-part-icon';

function TestComponent( {
	onChange,
}: {
	onChange: ( information: BlockDisplayInformation | null ) => void;
} ) {
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
	isSectionBlock = true,
}: {
	attributes?: BlockDisplayAttributes;
	blockName?: string;
	blockType?: {
		name: string;
		title: string;
		icon: string;
		description: string;
	};
	getActiveBlockVariation?: () => null;
	isSectionBlock?: boolean;
} = {} ) {
	( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getBlockName: () => blockName,
			getBlockAttributes: () => attributes,
			__experimentalGetParsedPattern: () => ( {
				title: 'Hero pattern',
				description: 'Pattern description.',
			} ),
			isSectionBlock: () => isSectionBlock,
			getBlockType: () => blockType,
			getActiveBlockVariation,
		} ) )
	);
}

describe( 'useBlockDisplayInformation', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'displays pattern information for a pattern section that is not being edited', () => {
		setupUseSelect();
		const onChange = vi.fn();

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
		setupUseSelect( { isSectionBlock: false } );
		const onChange = vi.fn();

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
			isSectionBlock: false,
		} );
		const onChange = vi.fn();

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

	it( 'displays block information for a pattern wrapper when content-only editing is disabled', () => {
		setupUseSelect( {
			isSectionBlock: false,
		} );
		const onChange = vi.fn();

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

	it( 'displays block information for section blocks without pattern metadata', () => {
		setupUseSelect( {
			attributes: {},
			blockName: 'core/template-part',
			blockType: {
				name: 'core/template-part',
				title: 'Template Part',
				icon: templatePartIcon,
				description: 'A template part.',
			},
		} );
		const onChange = vi.fn();

		render( <TestComponent onChange={ onChange } /> );

		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: 'Template Part',
				icon: templatePartIcon,
				description: 'A template part.',
			} )
		);
	} );
} );
