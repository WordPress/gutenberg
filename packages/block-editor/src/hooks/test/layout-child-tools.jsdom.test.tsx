import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { memo } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import layoutChild from '../layout-child';

type TestWindow = Window & {
	__experimentalEnableGridInteractivity?: boolean;
	__experimentalEnableBlockRotation?: boolean;
};

const GRID_LAYOUT = {
	type: 'grid',
	isManualPlacement: true,
	columnCount: 3,
	rowCount: 2,
	// The layout context merges in the grid block's layout support.
	allowSizingOnChildren: true,
};

vi.mock(
	import( '../../components/block-list/layout' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		useLayout: () => GRID_LAYOUT,
	} )
);
// Only the rotate handle and the resizer are under test, so the other grid
// tools render nothing, the resizer is a marker and the rotate handle is a
// button that previews a rotation.
vi.mock( import( '../../components/grid' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	GridVisualizer: memo( () => <></> ),
	GridItemResizer: () => <div data-testid="grid-item-resizer" />,
	GridItemMovers: () => <></>,
	GridItemDragHandle: () => <></>,
	GridItemRotator: ( {
		onPreview,
	}: {
		onPreview?: ( angle: number | null ) => void;
	} ) => (
		<button
			data-testid="grid-item-rotator"
			onClick={ () => onPreview?.( 30 ) }
		/>
	),
} ) );

const GRID_BLOCK = 'test/grid';
const ITEM_BLOCK = 'test/grid-item';

function GridItemTools( {
	clientId,
	style,
}: {
	clientId: string;
	style?: Record< string, unknown >;
} ) {
	const Edit = layoutChild.edit;
	return <Edit clientId={ clientId } name={ ITEM_BLOCK } style={ style } />;
}

function renderGridItemTools( style?: Record< string, unknown > ) {
	const item = createBlock( ITEM_BLOCK );
	const grid = createBlock( GRID_BLOCK, { layout: GRID_LAYOUT }, [ item ] );
	act( () => {
		dispatch( blockEditorStore ).resetBlocks( [ grid ] );
	} );
	const view = render(
		<GridItemTools clientId={ item.clientId } style={ style } />
	);
	return { ...view, clientId: item.clientId };
}

function queryRotator() {
	return screen.queryByTestId( 'grid-item-rotator' );
}

function queryResizer() {
	return screen.queryByTestId( 'grid-item-resizer' );
}

describe( 'grid item rotate handle', () => {
	beforeEach( () => {
		registerBlockType( GRID_BLOCK, {
			apiVersion: 3,
			title: 'Grid',
			category: 'design',
			attributes: { layout: { type: 'object' } },
			supports: { layout: { allowSizingOnChildren: true } },
			edit: () => null,
			save: () => null,
		} );
		registerBlockType( ITEM_BLOCK, {
			apiVersion: 3,
			title: 'Grid item',
			category: 'text',
			attributes: {},
			edit: () => null,
			save: () => null,
		} );
		( window as TestWindow ).__experimentalEnableGridInteractivity = true;
		( window as TestWindow ).__experimentalEnableBlockRotation = true;
	} );

	afterEach( () => {
		unregisterBlockType( GRID_BLOCK );
		unregisterBlockType( ITEM_BLOCK );
		delete ( window as TestWindow ).__experimentalEnableGridInteractivity;
		delete ( window as TestWindow ).__experimentalEnableBlockRotation;
	} );

	it( 'is shown for blocks in a manual grid', () => {
		renderGridItemTools();
		expect( queryRotator() ).toBeInTheDocument();
	} );

	it( 'is not shown without the block rotation experiment', () => {
		delete ( window as TestWindow ).__experimentalEnableBlockRotation;
		renderGridItemTools();
		expect( queryRotator() ).not.toBeInTheDocument();
	} );

	it( 'is not shown in a pseudo state', () => {
		const { clientId } = renderGridItemTools();
		act( () => {
			unlock( dispatch( blockEditorStore ) ).setSelectedBlockStyleState(
				clientId,
				{ viewport: 'default', pseudo: ':hover' }
			);
		} );
		expect( queryRotator() ).not.toBeInTheDocument();
	} );

	it( 'is not shown for blocks that cannot be fully edited', () => {
		const { clientId } = renderGridItemTools();
		act( () => {
			dispatch( blockEditorStore ).setBlockEditingMode(
				clientId,
				'contentOnly'
			);
		} );
		expect( queryRotator() ).not.toBeInTheDocument();
	} );
} );

describe( 'grid item resizer', () => {
	beforeEach( () => {
		registerBlockType( GRID_BLOCK, {
			apiVersion: 3,
			title: 'Grid',
			category: 'design',
			attributes: { layout: { type: 'object' } },
			supports: { layout: { allowSizingOnChildren: true } },
			edit: () => null,
			save: () => null,
		} );
		registerBlockType( ITEM_BLOCK, {
			apiVersion: 3,
			title: 'Grid item',
			category: 'text',
			attributes: {},
			edit: () => null,
			save: () => null,
		} );
		( window as TestWindow ).__experimentalEnableGridInteractivity = true;
		( window as TestWindow ).__experimentalEnableBlockRotation = true;
	} );

	afterEach( () => {
		unregisterBlockType( GRID_BLOCK );
		unregisterBlockType( ITEM_BLOCK );
		delete ( window as TestWindow ).__experimentalEnableGridInteractivity;
		delete ( window as TestWindow ).__experimentalEnableBlockRotation;
	} );

	it( 'is shown for blocks that are not rotated', () => {
		renderGridItemTools();
		expect( queryResizer() ).toBeInTheDocument();
	} );

	it( 'is not shown for rotated blocks', () => {
		renderGridItemTools( { rotate: 45 } );
		expect( queryResizer() ).not.toBeInTheDocument();
	} );

	it( 'is not shown while a rotation is previewed', () => {
		renderGridItemTools();
		fireEvent.click( queryRotator()! );
		expect( queryResizer() ).not.toBeInTheDocument();
	} );
} );
