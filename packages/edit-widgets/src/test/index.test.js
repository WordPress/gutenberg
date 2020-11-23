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
import { register } from '..';
import './mocks/server';
import availableLegacyWidgets from './mocks/available-legacy-widgets';

jest.setTimeout( 30000 );

const editorSettings = {
	availableLegacyWidgets,
};

describe( 'edit-widgets', () => {
	// eslint-disable-next-line jest/no-focused-tests
	it.only( 'renders', async () => {
		render( register( editorSettings ) );

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

		const recentPostsHeading = await findByRole( recentPosts, 'heading', {
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
		render( register( editorSettings ) );

		const widgetAreas = await screen.findAllByRole( 'group', {
			name: 'Block: Widget Area',
		} );

		const [ footer ] = widgetAreas;

		let footerBlocks = await findAllByRole( footer, 'group' );
		expect( footerBlocks.length ).toBe( 4 );

		const documentTools = screen.getByRole( 'toolbar', {
			name: 'Document tools',
			hidden: true,
		} );
		const globalInserterButton = getByRole( documentTools, 'button', {
			name: 'Add block',
			hidden: true,
		} );

		fireEvent.click( globalInserterButton );

		const globalInserterBlocksList = await screen.findByRole( 'listbox', {
			name: 'Child Blocks',
			hidden: true,
		} );
		const addParagraphBlockButton = getByRole(
			globalInserterBlocksList,
			'option',
			{
				name: 'Paragraph',
				hidden: true,
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
