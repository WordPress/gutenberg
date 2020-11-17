/**
 * WordPress dependencies
 */
import {
	renderInitialize,
	screen,
	getByRole,
	findByRole,
	findAllByRole,
	queryAllByRole,
	fireEvent,
} from '@wordpress/testing-library';

/**
 * Internal dependencies
 */
import { initialize } from '..';
import './mocks/server';
import availableLegacyWidgets from './mocks/available-legacy-widgets';

// We need this since some tests run over 5 seconds threshold.
// Also keep this as a TODO for us to improve the performance of the components.
jest.setTimeout( 30000 );

const editorSettings = {
	availableLegacyWidgets,
};

describe( 'edit-widgets', () => {
	it( 'renders', async () => {
		renderInitialize( initialize, editorSettings );

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
		renderInitialize( initialize, editorSettings );

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
