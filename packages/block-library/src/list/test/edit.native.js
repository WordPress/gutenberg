/**
 * External dependencies
 */
import {
	selectRangeInRichText,
	typeInRichText,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	waitFor,
	within,
	addBlock,
	getBlock,
	triggerBlockListLayout,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { BACKSPACE } from '@wordpress/keycodes';

describe( 'List block', () => {
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

	it( 'inserts block', async () => {
		const screen = await initializeEditor();

		// Add block
		await addBlock( screen, 'List' );

		// Get block
		const listBlock = await getBlock( screen, 'List' );
		fireEvent.press( listBlock );
		expect( listBlock ).toBeVisible();

		// Trigger onLayout for the list
		await triggerBlockListLayout( listBlock );

		// Get List item
		const listItemBlock = await getBlock( screen, 'List item' );
		fireEvent.press( listItemBlock );

		expect( listItemBlock ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'adds one item to the list', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li></li><!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( listBlock );
		await triggerBlockListLayout( listBlock );

		// Select List Item block
		const [ listItemBlock ] = screen.getAllByLabelText(
			/List item Block\. Row 1/
		);
		fireEvent.press( listItemBlock );

		const listItemField =
			within( listBlock ).getByPlaceholderText( 'List' );
		typeInRichText( listItemField, 'First list item' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'shows different indentation levels', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>List item 1</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>List item 2<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>List item nested 1</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>List item nested 2<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Extra item 1</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Extra item 2</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list --></li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list --></li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>List item 3</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( listBlock );
		await triggerBlockListLayout( listBlock );

		// Select List Item block
		const [ firstNestedLevelBlock ] = within( listBlock ).getAllByLabelText(
			/List item Block\. Row 2/
		);
		fireEvent.press( firstNestedLevelBlock );
		await triggerBlockListLayout( firstNestedLevelBlock );

		// Select second level list
		const [ secondNestedLevelBlock ] = within(
			firstNestedLevelBlock
		).getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( secondNestedLevelBlock );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'changes the indentation level', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Item 1</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Item 2</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( listBlock );
		await triggerBlockListLayout( listBlock );

		// Select Secont List Item block
		const [ listItemBlock ] = screen.getAllByLabelText(
			/List item Block\. Row 2/
		);
		fireEvent.press( listItemBlock );

		// Update indentation
		const indentButton = screen.getByLabelText( 'Indent' );
		fireEvent.press( indentButton );

		// Await recently indented list item layout
		const [ listItemBlock1 ] = screen.getAllByLabelText(
			/List item Block\. Row 1/
		);
		await triggerBlockListLayout( listItemBlock1 );

		// wait until inserter on the newly created indented block is enabled
		// this is slightly delayed (by updating block list settings) and would
		// trigger an "update not wrapped in act()" warning if not explicitly awaited.
		screen.findByRole( 'button', { name: 'Add block', disabled: false } );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'removes the indentation level', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Item 1<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Item 2</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list --></li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( listBlock );
		await triggerBlockListLayout( listBlock );

		// Select List Item block
		const [ firstNestedLevelBlock ] = within( listBlock ).getAllByLabelText(
			/List item Block\. Row 1/
		);
		fireEvent.press( firstNestedLevelBlock );
		await triggerBlockListLayout( firstNestedLevelBlock );

		// Select Inner block List
		const [ innerBlockList ] = within(
			firstNestedLevelBlock
		).getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( innerBlockList );
		await triggerBlockListLayout( innerBlockList );

		// Select nested List Item block
		const [ listItemBlock ] = within( innerBlockList ).getAllByLabelText(
			/List item Block\. Row 1/
		);
		fireEvent.press( listItemBlock );

		// Update indentation
		const outdentButton = screen.getByLabelText( 'Outdent' );
		fireEvent.press( outdentButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'changes to ordered list', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Item 1</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Item 2</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Item 3</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Update to ordered list
		const orderedButton = screen.getByLabelText( 'Ordered' );
		fireEvent.press( orderedButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'changes to reverse ordered list', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Item 1</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Item 2</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Item 3</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Update to ordered list
		const orderedButton = screen.getByLabelText( 'Ordered' );
		fireEvent.press( orderedButton );

		// Set order to reverse

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		await waitFor(
			() => screen.getByTestId( 'block-settings-modal' ).props.isVisible
		);

		const reverseButton = screen.getByLabelText(
			/Reverse list numbering\. Off/
		);
		fireEvent.press( reverseButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'sets a start value to an ordered list', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Item 1</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Item 2</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Item 3</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Update to ordered list
		const orderedButton = screen.getByLabelText( 'Ordered' );
		fireEvent.press( orderedButton );

		// Set order to reverse

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		await waitFor(
			() => screen.getByTestId( 'block-settings-modal' ).props.isVisible
		);

		const startValueButton = screen.getByLabelText( /Start value\. Empty/ );
		fireEvent.press( startValueButton );
		const startValueInput =
			within( startValueButton ).getByDisplayValue( '' );
		fireEvent.changeText( startValueInput, '25' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'merges with other lists', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>One</li><!-- /wp:list-item --></ul>
		<!-- /wp:list --><!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Two</li><!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 2/ );
		fireEvent.press( listBlock );
		await triggerBlockListLayout( listBlock );

		// Select List Item block
		const [ listItemBlock ] = within( listBlock ).getAllByLabelText(
			/List item Block\. Row 1/
		);
		fireEvent.press( listItemBlock );

		// With cursor positioned at the beginning of the first List Item, press
		// backward delete
		const listItemField =
			within( listItemBlock ).getByLabelText( /Text input. .*Two.*/ );
		selectRangeInRichText( listItemField, 0 );
		fireEvent( listItemField, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: BACKSPACE,
		} );

		expect( getEditorHtml() ).toMatchInlineSnapshot( `
			"<!-- wp:list -->
			<ul><!-- wp:list-item -->
			<li>One</li>
			<!-- /wp:list-item -->

			<!-- wp:list-item -->
			<li>Two</li>
			<!-- /wp:list-item --></ul>
			<!-- /wp:list -->"
		` );
	} );

	it( 'unwraps first item when attempting to merge with non-list block', async () => {
		const initialHtml = `<!-- wp:paragraph -->
		<p>A quick brown fox.</p>
		<!-- /wp:paragraph -->
		<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>One</li><!-- /wp:list-item --><!-- wp:list-item -->
		<li>Two</li><!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 2/ );
		fireEvent.press( listBlock );
		await triggerBlockListLayout( listBlock );

		// Select List Item block
		const [ listItemBlock ] = within( listBlock ).getAllByLabelText(
			/List item Block\. Row 1/
		);
		fireEvent.press( listItemBlock );

		// With cursor positioned at the beginning of the first List Item, press
		// backward delete
		const listItemField =
			within( listItemBlock ).getByLabelText( /Text input. .*One.*/ );
		selectRangeInRichText( listItemField, 0 );
		fireEvent( listItemField, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: BACKSPACE,
		} );

		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A quick brown fox.</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph -->
		<p>One</p>
		<!-- /wp:paragraph -->

		<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Two</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->"
	` );
	} );

	it( 'merges first item into its own paragraph block and keeps its nested items', async () => {
		const initialHtml = `<!-- wp:paragraph -->
		<p>A quick brown fox.</p>
		<!-- /wp:paragraph -->
		<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>One<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Two</li>
		<!-- /wp:list-item -->
		<!-- wp:list-item -->
		<li>Three</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list --></li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const [ listBlock ] = screen.getAllByLabelText( /List Block\. Row 2/ );
		fireEvent.press( listBlock );
		await triggerBlockListLayout( listBlock );

		// Select List Item block
		const [ listItemBlock ] = within( listBlock ).getAllByLabelText(
			/List item Block\. Row 1/
		);
		fireEvent.press( listItemBlock );

		// With cursor positioned at the beginning of the first List Item, press
		// backward delete
		const listItemField =
			within( listItemBlock ).getByLabelText( /Text input. .*One.*/ );
		selectRangeInRichText( listItemField, 0 );
		fireEvent( listItemField, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: BACKSPACE,
		} );

		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A quick brown fox.</p>
		<!-- /wp:paragraph -->
		
		<!-- wp:paragraph -->
		<p>One</p>
		<!-- /wp:paragraph -->
		
		<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li>Two</li>
		<!-- /wp:list-item -->
		
		<!-- wp:list-item -->
		<li>Three</li>
		<!-- /wp:list-item --></ul>
		<!-- /wp:list -->"
	` );
	} );
} );
