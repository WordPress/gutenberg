import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import DataViews from '../index';
import type { Action, Field, View } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import '../../style.scss';

const initialViewport = {
	width: window.innerWidth,
	height: window.innerHeight,
};
beforeEach( async () => {
	// Wide enough for the primary actions to show next to each item.
	await page.viewport( 1280, 900 );
} );
afterEach( async () => {
	await page.viewport( initialViewport.width, initialViewport.height );
} );

type Post = { id: string; title: string; isLocked?: boolean };
const initialPosts: Post[] = [
	{ id: '1', title: 'First post' },
	{ id: '2', title: 'Second post' },
	{ id: '3', title: 'Third post' },
];
const fields: Field< Post >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
];

function TrashableView( {
	type = 'table',
	posts: startPosts = initialPosts,
	perPage = 10,
}: {
	type?: 'table' | 'list';
	posts?: Post[];
	perPage?: number;
} ) {
	const [ posts, setPosts ] = useState( startPosts );
	// Like the trash action of the editor, which closes its dialog once the
	// items are gone.
	const closeAfterRemovalRef = useRef< ( () => void ) | null >( null );
	useEffect( () => {
		closeAfterRemovalRef.current?.();
		closeAfterRemovalRef.current = null;
	}, [ posts ] );
	// Like a store: the items go after a refetch, during which the layout is
	// inert.
	const [ removing, setRemoving ] = useState< string[] | null >( null );
	useEffect( () => {
		if ( ! removing ) {
			return;
		}
		const timeout = setTimeout( () => {
			setPosts( ( current ) =>
				current.filter( ( post ) => ! removing.includes( post.id ) )
			);
			setRemoving( null );
		}, 50 );
		return () => clearTimeout( timeout );
	}, [ removing ] );
	// Like a store that drops the items, then refetches while the dialog
	// closes.
	const [ phase, setPhase ] = useState<
		'idle' | 'removed' | 'refetching' | 'closed'
	>( 'idle' );
	const closeDuringRefetchRef = useRef< ( () => void ) | null >( null );
	useEffect( () => {
		if ( phase === 'removed' ) {
			setPhase( 'refetching' );
		} else if ( phase === 'refetching' ) {
			closeDuringRefetchRef.current?.();
			setPhase( 'closed' );
		} else if ( phase === 'closed' ) {
			const timeout = setTimeout( () => setPhase( 'idle' ), 50 );
			return () => clearTimeout( timeout );
		}
		return undefined;
	}, [ phase ] );
	// Like a store that drops the items without a refetch.
	const [ quietlyRemoving, setQuietlyRemoving ] = useState< string[] | null >(
		null
	);
	useEffect( () => {
		if ( ! quietlyRemoving ) {
			return;
		}
		const timeout = setTimeout( () => {
			setPosts( ( current ) =>
				current.filter(
					( post ) => ! quietlyRemoving.includes( post.id )
				)
			);
			setQuietlyRemoving( null );
		}, 50 );
		return () => clearTimeout( timeout );
	}, [ quietlyRemoving ] );
	const [ view, setView ] = useState< View >( {
		type,
		titleField: 'title',
		page: 1,
		perPage,
	} as View );
	// Stable, so the dialogs keep their focus across renders.
	const actions = useMemo< Action< Post >[] >( () => {
		const removeLater = ( ids: string[] ) => setRemoving( ids );
		const removeNow = ( ids: string[] ) =>
			setPosts( ( current ) =>
				current.filter( ( post ) => ! ids.includes( post.id ) )
			);
		return [
			{
				id: 'trash',
				label: 'Trash',
				isPrimary: true,
				supportsBulk: true,
				isEligible: ( post ) => ! post.isLocked,
				RenderModal: ( { items, closeModal } ) => (
					<>
						<button
							onClick={ () => {
								closeModal?.();
								removeLater( items.map( ( item ) => item.id ) );
							} }
						>
							Confirm
						</button>
						<button
							onClick={ () => {
								closeAfterRemovalRef.current =
									closeModal ?? null;
								removeLater( items.map( ( item ) => item.id ) );
							} }
						>
							Confirm and wait
						</button>
						<button
							onClick={ () => {
								closeDuringRefetchRef.current =
									closeModal ?? null;
								removeNow( items.map( ( item ) => item.id ) );
								setPhase( 'removed' );
							} }
						>
							Confirm and refetch
						</button>
					</>
				),
			},
			{
				id: 'remove-now',
				label: 'Remove now',
				callback: ( items ) =>
					removeLater( items.map( ( item ) => item.id ) ),
			},
			{
				id: 'remove-slowly',
				label: 'Remove slowly',
				supportsBulk: true,
				isEligible: ( post ) => ! post.isLocked,
				// Drops the items, then finishes while its busy button shows.
				callback: async ( items ) => {
					removeNow( items.map( ( item ) => item.id ) );
					await new Promise( ( resolve ) =>
						window.requestAnimationFrame( () =>
							window.requestAnimationFrame( resolve )
						)
					);
				},
			},
			{
				id: 'remove-quietly',
				label: 'Remove quietly',
				callback: ( items ) =>
					setQuietlyRemoving( items.map( ( item ) => item.id ) ),
			},
			{
				id: 'archive',
				label: 'Archive',
				supportsBulk: true,
				disabled: true,
				callback: () => {},
			},
			{
				id: 'noop',
				label: 'Do nothing',
				supportsBulk: true,
				callback: () => {},
			},
		];
	}, [] );
	const { data, paginationInfo } = filterSortAndPaginate(
		posts,
		view,
		fields
	);
	return (
		<>
			<button>Outside</button>
			<DataViews
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				isLoading={
					!! removing || phase === 'refetching' || phase === 'closed'
				}
				paginationInfo={ paginationInfo }
				defaultLayouts={ { [ type ]: {} } }
			/>
		</>
	);
}

const selectAll = () =>
	page.getByRole( 'checkbox', { name: 'Select all', exact: true } );
const row = ( title: string ) =>
	page.getByRole( 'row' ).filter( { hasText: title } );

it( 'moves focus to "Select all" when a modal action removes the item', async () => {
	const user = userEvent.setup();
	await render( <TrashableView /> );
	await user.click(
		row( 'First post' ).getByRole( 'button', { name: /^Trash/ } )
	);
	await user.click( page.getByRole( 'button', { name: 'Confirm' } ) );

	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();
	await expect.element( selectAll() ).toHaveFocus();
} );

it( 'moves focus to "Select all" when an action from the menu removes the item', async () => {
	const user = userEvent.setup();
	await render( <TrashableView /> );
	await user.click(
		row( 'Second post' ).getByRole( 'button', { name: 'Actions' } )
	);
	await user.click( page.getByRole( 'menuitem', { name: 'Remove now' } ) );

	await expect
		.element( page.getByText( 'Second post' ) )
		.not.toBeInTheDocument();
	await expect.element( selectAll() ).toHaveFocus();
} );

it( 'moves focus to the search when a bulk action removes every item', async () => {
	const user = userEvent.setup();
	await render( <TrashableView /> );
	await user.click( selectAll() );
	const toolbar = page.elementLocator(
		document.querySelector( '.dataviews-bulk-actions' )!
	);
	await user.click( toolbar.getByRole( 'button', { name: /^Trash/ } ) );
	await user.click( page.getByRole( 'button', { name: 'Confirm' } ) );

	await expect
		.element( page.getByText( 'Third post' ) )
		.not.toBeInTheDocument();
	await expect.element( page.getByRole( 'searchbox' ) ).toHaveFocus();
} );

it( 'moves focus to "Select all" when a dialog closes after its items went', async () => {
	const user = userEvent.setup();
	await render(
		<TrashableView
			posts={ [
				...initialPosts,
				{ id: '4', title: 'Locked post', isLocked: true },
			] }
		/>
	);
	// The locked post keeps the toolbar, but not its Trash button, once the
	// first post is gone.
	await user.click( row( 'First post' ).getByRole( 'checkbox' ) );
	await user.click( row( 'Locked post' ).getByRole( 'checkbox' ) );
	const toolbar = page.elementLocator(
		document.querySelector( '.dataviews-bulk-actions' )!
	);
	await user.click( toolbar.getByRole( 'button', { name: /^Trash/ } ) );
	await user.click(
		page.getByRole( 'button', { name: 'Confirm and wait' } )
	);

	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();
	await expect.element( selectAll() ).toHaveFocus();
} );

it( 'waits for the items to load when a dialog closes during a refetch', async () => {
	const user = userEvent.setup();
	await render(
		<TrashableView
			posts={ [
				...initialPosts,
				{ id: '4', title: 'Locked post', isLocked: true },
			] }
		/>
	);
	await user.click( row( 'First post' ).getByRole( 'checkbox' ) );
	await user.click( row( 'Locked post' ).getByRole( 'checkbox' ) );
	const toolbar = page.elementLocator(
		document.querySelector( '.dataviews-bulk-actions' )!
	);
	await user.click( toolbar.getByRole( 'button', { name: /^Trash/ } ) );
	await user.click(
		page.getByRole( 'button', { name: 'Confirm and refetch' } )
	);

	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();
	// Not the search, which it would be while the layout is inert.
	await expect.element( selectAll() ).toHaveFocus();
} );

it( 'moves focus to "Select all" once the busy button of an action goes', async () => {
	const user = userEvent.setup();
	await render(
		<TrashableView
			posts={ [
				...initialPosts,
				{ id: '4', title: 'Locked post', isLocked: true },
			] }
		/>
	);
	await user.click( row( 'First post' ).getByRole( 'checkbox' ) );
	await user.click( row( 'Locked post' ).getByRole( 'checkbox' ) );
	const toolbar = page.elementLocator(
		document.querySelector( '.dataviews-bulk-actions' )!
	);
	await user.click(
		toolbar.getByRole( 'button', { name: 'Remove slowly' } )
	);

	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();
	await expect.element( selectAll() ).toHaveFocus();
} );

it( 'moves focus to the search once an action with a busy button removes every item', async () => {
	const user = userEvent.setup();
	await render( <TrashableView /> );
	await user.click( selectAll() );
	const toolbar = page.elementLocator(
		document.querySelector( '.dataviews-bulk-actions' )!
	);
	// The toolbar goes with the items once the action ends.
	await user.click(
		toolbar.getByRole( 'button', { name: 'Remove slowly' } )
	);

	await expect
		.element( page.getByText( 'Third post' ) )
		.not.toBeInTheDocument();
	await expect.element( page.getByRole( 'searchbox' ) ).toHaveFocus();
} );

it( 'moves focus to the first item of a list when no checkbox is left', async () => {
	const user = userEvent.setup();
	await render( <TrashableView type="list" /> );
	await user.click(
		page.getByRole( 'button', { name: 'First post', exact: true } )
	);
	await user.click( page.getByRole( 'button', { name: /^Trash/ } ).first() );
	await user.click( page.getByRole( 'button', { name: 'Confirm' } ) );

	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();
	await expect
		.element(
			page.getByRole( 'button', { name: 'Second post', exact: true } )
		)
		.toHaveFocus();
} );

it( 'leaves focus alone when the action keeps the item', async () => {
	const user = userEvent.setup();
	await render( <TrashableView /> );
	const actionsButton = row( 'First post' ).getByRole( 'button', {
		name: 'Actions',
	} );
	await user.click( actionsButton );
	await user.click( page.getByRole( 'menuitem', { name: 'Do nothing' } ) );

	await expect.element( actionsButton ).toHaveFocus();
} );

it( 'stops waiting once the user moved to another control in the view', async () => {
	const user = userEvent.setup();
	await render( <TrashableView /> );
	await user.click(
		row( 'First post' ).getByRole( 'button', { name: 'Actions' } )
	);
	await user.click( page.getByRole( 'menuitem', { name: 'Remove now' } ) );
	// Before the item goes.
	const search = page.getByRole( 'searchbox' );
	await user.click( search );
	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();
	await expect.element( search ).toHaveFocus();

	// Later, focus is lost for another reason and the page changes.
	( search.element() as HTMLElement ).blur();
	document.body.append( document.createElement( 'div' ) );
	await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

	await expect.element( selectAll() ).not.toHaveFocus();
} );

it( 'stops waiting once focus is on a disabled control the action does not hold', async () => {
	const user = userEvent.setup();
	await render( <TrashableView perPage={ 2 } /> );
	await user.click(
		row( 'First post' ).getByRole( 'button', { name: 'Actions' } )
	);
	await user.click( page.getByRole( 'menuitem', { name: 'Do nothing' } ) );
	// The items of the first page go from the view, and the button is
	// disabled on the last page.
	const next = page.getByRole( 'button', { name: 'Next page' } );
	await user.click( next );
	await expect.element( page.getByText( 'Third post' ) ).toBeVisible();

	( next.element() as HTMLElement ).blur();
	document.body.append( document.createElement( 'div' ) );
	await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

	await expect.element( selectAll() ).not.toHaveFocus();
} );

it( 'waits for the busy actions menu of a small screen', async () => {
	await page.viewport( 600, 900 );
	const user = userEvent.setup();
	await render( <TrashableView /> );
	await user.click( selectAll() );
	const toolbar = page.elementLocator(
		document.querySelector( '.dataviews-bulk-actions' )!
	);
	await user.click( toolbar.getByRole( 'button', { name: 'Actions' } ) );
	await user.click( page.getByRole( 'menuitem', { name: 'Remove slowly' } ) );

	await expect
		.element( page.getByText( 'Third post' ) )
		.not.toBeInTheDocument();
	await expect.element( page.getByRole( 'searchbox' ) ).toHaveFocus();
} );

it( 'stops waiting once focus is on a disabled bulk action that is not busy', async () => {
	const user = userEvent.setup();
	await render(
		<TrashableView
			posts={ [
				...initialPosts,
				{ id: '4', title: 'Locked post', isLocked: true },
			] }
		/>
	);
	await user.click( row( 'Locked post' ).getByRole( 'checkbox' ) );
	await user.click(
		row( 'First post' ).getByRole( 'button', { name: 'Actions' } )
	);
	await user.click(
		page.getByRole( 'menuitem', { name: 'Remove quietly' } )
	);
	// Before the item goes, focus moves to an action that's just disabled.
	const toolbar = page.elementLocator(
		document.querySelector( '.dataviews-bulk-actions' )!
	);
	const archive = toolbar.getByRole( 'button', { name: 'Archive' } );
	( archive.element() as HTMLElement ).focus();
	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();

	( archive.element() as HTMLElement ).blur();
	document.body.append( document.createElement( 'div' ) );
	await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

	await expect.element( selectAll() ).not.toHaveFocus();
} );

it( 'does not take focus back once the user moved it elsewhere', async () => {
	const user = userEvent.setup();
	await render( <TrashableView /> );
	await user.click(
		row( 'First post' ).getByRole( 'button', { name: /^Trash/ } )
	);
	await user.click( page.getByRole( 'button', { name: 'Confirm' } ) );
	await user.click( page.getByRole( 'button', { name: 'Outside' } ) );

	await expect
		.element( page.getByText( 'First post' ) )
		.not.toBeInTheDocument();
	await expect
		.element( page.getByRole( 'button', { name: 'Outside' } ) )
		.toHaveFocus();
} );
