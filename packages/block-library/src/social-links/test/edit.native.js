/**
 * External dependencies
 */
import {
	addBlock,
	dismissModal,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	within,
	getBlock,
	screen,
	triggerBlockListLayout,
	waitFor,
	waitForModalVisible,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Social links block', () => {
	it( 'inserts block with the default icons and the WordPress link set as active', async () => {
		await initializeEditor();

		// Add block
		await addBlock( screen, 'Social Icons' );

		// Get block
		const socialLinksBlock = await getBlock( screen, 'Social Icons' );

		// Trigger inner blocks layout
		const innerBlockListWrapper = await waitFor( () =>
			within( socialLinksBlock ).getByTestId( 'block-list-wrapper' )
		);
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 300,
				},
			},
		} );

		// Check the WordPress icon has a URL set (active)
		const firstLinkBlock = await getBlock( screen, 'Social Icon' );
		fireEvent.press( firstLinkBlock );
		const firstLink = within( socialLinksBlock ).getByAccessibilityHint(
			/WordPress has URL set/
		);
		expect( firstLink ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'shows active links correctly when not selected', async () => {
		await initializeEditor();

		// Add Social Icons block
		await addBlock( screen, 'Social Icons' );

		// Get block
		const socialLinksBlock = await getBlock( screen, 'Social Icons' );

		// Trigger inner blocks layout
		const innerBlockListWrapper = await waitFor( () =>
			within( socialLinksBlock ).getByTestId( 'block-list-wrapper' )
		);
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 300,
				},
			},
		} );

		// Add Paragraph block
		await addBlock( screen, 'Paragraph' );

		// Check there's only one active social link
		const socialLinks =
			within( socialLinksBlock ).getAllByLabelText( / social icon/ );
		expect( socialLinks.length ).toBe( 1 );

		// Check the WordPress link is shown when unselected
		const firstLinkBlock = await getBlock( screen, 'Social Icon' );
		fireEvent.press( firstLinkBlock );
		const firstLink = within( socialLinksBlock ).getByAccessibilityHint(
			/WordPress has URL set/
		);
		expect( firstLink ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'shows the social links bottom sheet when tapping on the inline appender', async () => {
		await initializeEditor();

		// Add block
		await addBlock( screen, 'Social Icons' );

		// Get block
		const socialLinksBlock = await getBlock( screen, 'Social Icons' );
		fireEvent.press( socialLinksBlock );

		// Trigger inner blocks layout
		const innerBlockListWrapper = await waitFor( () =>
			within( socialLinksBlock ).getByTestId( 'block-list-wrapper' )
		);
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 300,
				},
			},
		} );

		// Open the links bottom sheet
		const appenderButton =
			within( socialLinksBlock ).getByTestId( 'appender-button' );
		fireEvent.press( appenderButton );

		// Find a social link in the inserter
		const blockList = screen.getByTestId( 'InserterUI-Blocks' );

		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( blockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		// Add the Amazon link
		const amazonBlock = await screen.findByText( 'Amazon' );
		expect( amazonBlock ).toBeVisible();

		fireEvent.press( amazonBlock );

		await screen.findByTestId( 'navigation-screen-LinkSettingsScreen' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'shows only the social link blocks when tapping on the inline appender', async () => {
		await initializeEditor();

		// Add block
		await addBlock( screen, 'Social Icons' );

		// Get block
		const socialLinksBlock = await getBlock( screen, 'Social Icons' );
		fireEvent.press( socialLinksBlock );
		await triggerBlockListLayout( socialLinksBlock );

		// Open the links bottom sheet
		const appenderButton =
			within( socialLinksBlock ).getByTestId( 'appender-button' );
		fireEvent.press( appenderButton );

		// Find a social link in the inserter
		const inserterList = screen.getByTestId( 'InserterUI-Blocks' );

		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( inserterList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		// Check the Paragraph core block is not in the list
		expect(
			within( inserterList ).queryByLabelText( 'Paragraph block' )
		).toBeNull();
	} );

	it( 'shows the ghost placeholder when no icon is active', async () => {
		await initializeEditor();
		const { getByLabelText } = screen;

		// Add block
		await addBlock( screen, 'Social Icons' );

		// Get block
		const socialLinksBlock = await getBlock( screen, 'Social Icons' );

		// Trigger inner blocks layout
		const innerBlockListWrapper = await waitFor( () =>
			within( socialLinksBlock ).getByTestId( 'block-list-wrapper' )
		);
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 300,
				},
			},
		} );

		// Get the first social link
		const firstLinkBlock = await getBlock( screen, 'Social Icon' );
		fireEvent.press( firstLinkBlock );

		// Open block actions menu
		const blockActionsButton = getByLabelText( /Open Block Actions Menu/ );
		fireEvent.press( blockActionsButton );

		// Delete the social link
		const deleteButton = getByLabelText( /Remove block/ );
		fireEvent.press( deleteButton );

		// Add Paragraph block
		await addBlock( screen, 'Paragraph' );

		// Check the ghost placeholders are visible
		const socialLinks = within( socialLinksBlock ).getAllByTestId(
			'social-links-placeholder'
		);
		expect( socialLinks.length ).toBe( 3 );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( "should set a icon's URL", async () => {
		await initializeEditor();
		await addBlock( screen, 'Social Icons' );
		fireEvent.press( screen.getByLabelText( 'Facebook social icon' ) );
		fireEvent.press( screen.getByLabelText( 'Add link to Facebook' ) );

		await waitForModalVisible(
			screen.getByTestId( 'link-settings-navigation' )
		);
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Add URL' ),
			'https://facebook.com'
		);
		dismissModal( screen.getByTestId( 'link-settings-navigation' ) );

		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:social-links -->
		<ul class="wp-block-social-links"><!-- wp:social-link {"url":"https://wordpress.org","service":"wordpress"} /-->

		<!-- wp:social-link {"url":"https://facebook.com","service":"facebook","label":"","rel":""} /-->

		<!-- wp:social-link {"service":"twitter"} /-->

		<!-- wp:social-link {"service":"instagram"} /--></ul>
		<!-- /wp:social-links -->"
	` );
	} );
} );
