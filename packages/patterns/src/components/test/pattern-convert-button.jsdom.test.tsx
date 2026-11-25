import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { CreatePatternModalProps } from '../types';
import PatternConvertButton from '../pattern-convert-button';

const { selectors, dispatchers, modalProps } = vi.hoisted( () => ( {
	selectors: {
		areBlocksContiguous: vi.fn(),
		canRemoveBlocks: vi.fn(),
		canInsertBlockType: vi.fn(),
		getBlockRootClientId: vi.fn(),
		getBlocksByClientId: vi.fn(),
		canUser: vi.fn(),
	},
	dispatchers: {
		replaceBlocks: vi.fn(),
		setEditingPattern: vi.fn(),
		createSuccessNotice: vi.fn(),
	},
	modalProps: { current: undefined as CreatePatternModalProps | undefined },
} ) );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useRegistry: ( () => ( {
		select: () => selectors,
	} ) ) as unknown as typeof import( '@wordpress/data' ).useRegistry,
	useSelect: ( (
		callback?: ( select: () => typeof selectors ) => unknown
	) =>
		typeof callback === 'function'
			? callback( () => selectors )
			: selectors ) as typeof import( '@wordpress/data' ).useSelect,
	useDispatch: ( () =>
		dispatchers ) as typeof import( '@wordpress/data' ).useDispatch,
} ) );
vi.mock( import( '../../lock-unlock' ), () => ( {
	unlock: < T, >( value: unknown ): T => value as T,
} ) );
vi.mock( import( '../../store' ), () => ( {
	store: {} as typeof import( '../../store' ).store,
} ) );
vi.mock( import( '../create-pattern-modal' ), () => ( {
	default: ( props: CreatePatternModalProps ) => {
		modalProps.current = props;
		return <></>;
	},
} ) );

describe( 'pattern conversion selection', () => {
	beforeEach( () => {
		modalProps.current = undefined;
		selectors.areBlocksContiguous.mockReturnValue( true );
		selectors.canRemoveBlocks.mockReturnValue( true );
		selectors.canInsertBlockType.mockReturnValue( true );
		selectors.canUser.mockReturnValue( true );
		selectors.getBlockRootClientId.mockReturnValue( 'group' );
		selectors.getBlocksByClientId.mockReturnValue( [
			{ name: 'core/paragraph', isValid: true },
			{ name: 'core/paragraph', isValid: true },
		] );
	} );
	it( 'hides Create pattern for non-contiguous selections', () => {
		selectors.areBlocksContiguous.mockReturnValue( false );
		render(
			<PatternConvertButton
				clientIds={ [ 'a', 'c' ] }
				closeBlockSettingsMenu={ vi.fn() }
			/>
		);
		expect(
			screen.queryByRole( 'menuitem', { name: 'Create pattern' } )
		).not.toBeInTheDocument();
		expect( modalProps.current ).toBeUndefined();
	} );
	it.each( [ 'non-contiguous', 'locked' ] )(
		'rechecks %s originals after saving a synced pattern',
		( change ) => {
			render(
				<PatternConvertButton
					clientIds={ [ 'a', 'c' ] }
					closeBlockSettingsMenu={ vi.fn() }
				/>
			);
			fireEvent.click(
				screen.getByRole( 'menuitem', { name: 'Create pattern' } )
			);
			expect( modalProps.current ).toBeDefined();
			if ( change === 'locked' ) {
				selectors.canRemoveBlocks.mockReturnValue( false );
			} else {
				selectors.areBlocksContiguous.mockReturnValue( false );
			}
			act( () =>
				modalProps.current!.onSuccess( {
					pattern: {
						id: 1,
						title: { raw: 'Pattern' },
						wp_pattern_sync_status: '',
					},
				} as Parameters< CreatePatternModalProps[ 'onSuccess' ] >[ 0 ] )
			);
			expect( dispatchers.replaceBlocks ).not.toHaveBeenCalled();
			expect( dispatchers.setEditingPattern ).not.toHaveBeenCalled();
		}
	);
} );
