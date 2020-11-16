/**
 * External dependencies
 */
import {
	render,
	screen,
	getByRole,
	findByRole,
	findAllByRole,
	queryAllByRole,
	fireEvent,
} from '@testing-library/react';

/**
 * Internal dependencies
 */
import { initialize } from '../';
import Layout from '../components/layout';
import { server } from './mocks/server';
import availableLegacyWidgets from './mocks/available-legacy-widgets';

beforeAll( () => server.listen() );
afterEach( () => server.resetHandlers() );
afterAll( () => server.close() );

jest.setTimeout( 10000 );

const editorSettings = {
	availableLegacyWidgets,
};

// Mock "@wordpress/element".render, so that initialize() doesn't actually render the component.
jest.mock( '@wordpress/element', () => {
	const WPElement = require.requireActual( '@wordpress/element' );
	return {
		...WPElement,
		render: () => {},
	};
} );

beforeAll( () => {
	initialize( 'root', editorSettings );
} );

describe( 'edit-widgets', () => {
	it( 'renders', async () => {
		render( <Layout blockEditorSettings={ editorSettings } /> );

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
		expect( inactiveWidgetsHeading ).toHaveTextContent(
			'Inactive widgets'
		);

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

		const inactiveWidgetsBlocks = queryAllByRole(
			inactiveWidgets,
			'group'
		);
		expect( inactiveWidgetsBlocks ).toEqual( [] );
	} );

	it( 'should default to insert blocks to the first widget area', async () => {
		render( <Layout blockEditorSettings={ editorSettings } /> );

		const widgetAreas = await screen.findAllByRole( 'group', {
			name: 'Block: Widget Area',
		} );

		const [ footer ] = widgetAreas;

		let footerBlocks = await findAllByRole( footer, 'group' );
		expect( footerBlocks.length ).toBe( 4 );

		const globalInserterButton = screen.getByRole( 'button', {
			name: 'Add block',
		} );

		fireEvent.click( globalInserterButton );

		const globalInserterBlocksList = await screen.findByRole( 'listbox', {
			name: 'Child Blocks',
		} );

		const addParagraphBlockButton = await findByRole(
			globalInserterBlocksList,
			'option',
			{
				name: 'Paragraph',
			}
		);

		fireEvent.click( addParagraphBlockButton );

		footerBlocks = await findAllByRole( footer, 'group' );
		expect( footerBlocks.length ).toBe( 5 );

		const insertedParagraphBlock = footerBlocks[ 4 ];

		expect( insertedParagraphBlock ).toHaveFocus();
		expect( insertedParagraphBlock ).toHaveAttribute( 'role', 'group' );
		expect( insertedParagraphBlock ).toHaveAttribute(
			'contenteditable',
			'true'
		);
	} );
} );
