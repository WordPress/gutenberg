/**
 * External dependencies
 */
import {
	changeTextOfRichText,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	waitFor,
	within,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

describe( 'List block', () => {
	beforeAll( () => {
		// Register all core blocks
		registerCoreBlocks( {
			__experimentalEnableListBlockV2: false,
		} );
	} );

	afterAll( () => {
		// Clean up registered blocks
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'inserts block', async () => {
		const { getByA11yLabel, getByTestId, getByText } =
			await initializeEditor();

		fireEvent.press( getByA11yLabel( 'Add block' ) );

		const blockList = getByTestId( 'InserterUI-Blocks' );
		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( blockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		fireEvent.press( await waitFor( () => getByText( 'List' ) ) );

		expect( getByA11yLabel( /List Block\. Row 1/ ) ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'renders a list with a few items', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>
		<!-- /wp:list -->`;

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );

describe( 'List V2 block', () => {
	beforeAll( () => {
		// Register all core blocks
		registerCoreBlocks( {
			__experimentalEnableListBlockV2: true,
		} );
	} );

	afterAll( () => {
		// Clean up registered blocks
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'inserts block', async () => {
		const { getByA11yLabel, getByTestId, getByText } =
			await initializeEditor();

		fireEvent.press( getByA11yLabel( 'Add block' ) );

		const blockList = getByTestId( 'InserterUI-Blocks' );
		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( blockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		fireEvent.press( await waitFor( () => getByText( 'List' ) ) );

		expect( getByA11yLabel( /List Block\. Row 1/ ) ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'adds one item to the list', async () => {
		const initialHtml = `<!-- wp:list -->
		<ul><!-- wp:list-item -->
		<li></li><!-- /wp:list-item --></ul>
		<!-- /wp:list -->`;

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Select List Item block
		const listItemBlock = getByA11yLabel( /List item Block\. Row 1/ );
		fireEvent.press( listItemBlock );

		const listItemField =
			within( listBlock ).getByPlaceholderText( 'List' );
		changeTextOfRichText( listItemField, 'First list item' );

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

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );

		fireEvent.press( listBlock );

		// Select List Item block
		const firstNestedLevelBlock = within( listBlock ).getByA11yLabel(
			/List item Block\. Row 2/
		);
		fireEvent.press( firstNestedLevelBlock );

		// Select second level list
		const secondNestedLevelBlock = within(
			firstNestedLevelBlock
		).getByA11yLabel( /List Block\. Row 1/ );
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

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Select Secont List Item block
		const listItemBlock = getByA11yLabel( /List item Block\. Row 2/ );
		fireEvent.press( listItemBlock );

		// Update indentation
		const indentButton = getByA11yLabel( 'Indent' );
		fireEvent.press( indentButton );

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

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Select List Item block
		const firstNestedLevelBlock = within( listBlock ).getByA11yLabel(
			/List item Block\. Row 1/
		);
		fireEvent.press( firstNestedLevelBlock );

		// Select Inner block List
		const innerBlockList = within( firstNestedLevelBlock ).getByA11yLabel(
			/List Block\. Row 1/
		);

		// Select nested List Item block
		const listItemBlock = within( innerBlockList ).getByA11yLabel(
			/List item Block\. Row 1/
		);
		fireEvent.press( listItemBlock );

		// Update indentation
		const outdentButton = getByA11yLabel( 'Outdent' );
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

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Update to ordered list
		const orderedButton = getByA11yLabel( 'Ordered' );
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

		const { getByA11yLabel, getByTestId } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Update to ordered list
		const orderedButton = getByA11yLabel( 'Ordered' );
		fireEvent.press( orderedButton );

		// Set order to reverse

		// Open block settings
		fireEvent.press( getByA11yLabel( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		const reverseButton = getByA11yLabel( /Reverse list numbering\. Off/ );
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

		const { getByA11yLabel, getByTestId } = await initializeEditor( {
			initialHtml,
		} );

		// Select List block
		const listBlock = getByA11yLabel( /List Block\. Row 1/ );
		fireEvent.press( listBlock );

		// Update to ordered list
		const orderedButton = getByA11yLabel( 'Ordered' );
		fireEvent.press( orderedButton );

		// Set order to reverse

		// Open block settings
		fireEvent.press( getByA11yLabel( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		const startValueButton = getByA11yLabel( /Start value\. Empty/ );
		fireEvent.press( startValueButton );
		const startValueInput =
			within( startValueButton ).getByDisplayValue( '' );
		fireEvent.changeText( startValueInput, '25' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
