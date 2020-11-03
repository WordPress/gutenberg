/**
 * External dependencies
 */
import {
	act,
	screen,
	getByRole,
	findAllByRole,
	queryAllByRole,
} from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { unmountComponentAtNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { initialize } from '../';
import { server } from './mocks/server';
import availableLegacyWidgets from './mocks/available-legacy-widgets';

beforeAll( () => server.listen() );
afterEach( () => server.resetHandlers() );
afterAll( () => server.close() );

let container;

beforeEach( () => {
	container = document.createElement( 'div' );
	container.id = 'root';
	document.body.appendChild( container );
} );

afterEach( () => {
	unmountComponentAtNode( container );
	document.body.removeChild( container );
} );

test( 'it renders', async () => {
	act( () => {
		initialize( 'root', {
			availableLegacyWidgets,
		} );
	} );

	const widgetAreas = await screen.findAllByRole( 'group', {
		name: 'Block: Widget Area',
	} );
	expect( widgetAreas.length ).toBe( 2 );

	const [ footer, inactiveWidgets ] = widgetAreas;

	const footerHeading = getByRole( footer, 'heading', { level: 2 } );
	expect( footerHeading ).toHaveTextContent( 'Footer' );

	const inactiveWidgetsHeading = getByRole( inactiveWidgets, 'heading', {
		level: 2,
	} );
	expect( inactiveWidgetsHeading ).toHaveTextContent( 'Inactive widgets' );

	const footerBlocks = await findAllByRole( footer, 'group' );
	expect( footerBlocks.length ).toBe( 4 );

	const [
		firstParagraph,
		recentPosts,
		search,
		secondParagraph,
	] = footerBlocks;

	expect( firstParagraph ).toHaveTextContent( 'First Paragraph' );

	const recentPostsHeading = getByRole( recentPosts, 'heading', {
		level: 3,
	} );
	expect( recentPostsHeading ).toHaveTextContent(
		'Recent Posts: Recent Posts'
	);

	const searchHeading = getByRole( search, 'heading', { level: 3 } );
	expect( searchHeading ).toHaveTextContent( 'Search: Search' );

	expect( secondParagraph ).toHaveTextContent( 'Second Paragraph' );

	const inactiveWidgetsBlocks = queryAllByRole( inactiveWidgets, 'group' );
	expect( inactiveWidgetsBlocks ).toEqual( [] );
} );
