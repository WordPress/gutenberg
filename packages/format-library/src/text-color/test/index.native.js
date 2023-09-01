/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	fireEvent,
	waitFor,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { setDefaultBlockName, unregisterBlockType } from '@wordpress/blocks';
import { coreBlocks } from '@wordpress/block-library';

const COLOR_PINK = '#f78da7';
const paragraph = coreBlocks[ 'core/paragraph' ];

const TEXT_WITH_COLOR = `<!-- wp:paragraph -->
<p>Hello <mark style="background-color:rgba(0,0,0,0);color:#cf2e2e" class="has-inline-color has-vivid-red-color">this is a test</mark></p>
<!-- /wp:paragraph -->`;

beforeAll( () => {
	paragraph.init();
	setDefaultBlockName( paragraph.name );
} );

afterAll( () => {
	unregisterBlockType( paragraph.name );
} );

describe( 'Text color', () => {
	it( 'shows the text color formatting button in the toolbar', async () => {
		const screen = await initializeEditor();

		// Wait for the editor placeholder
		const paragraphPlaceholder = await screen.findByLabelText(
			'Add paragraph block'
		);
		expect( paragraphPlaceholder ).toBeDefined();
		fireEvent.press( paragraphPlaceholder );

		// Wait for the block to be created
		const [ paragraphBlock ] = await screen.findAllByLabelText(
			/Paragraph Block\. Row 1/
		);
		expect( paragraphBlock ).toBeDefined();

		// Look for the highlight text color button
		const textColorButton = await screen.findByLabelText( 'Text color' );
		expect( textColorButton ).toBeDefined();
	} );

	it( 'allows toggling the highlight color feature to type new text', async () => {
		const screen = await initializeEditor();

		// Wait for the editor placeholder
		const paragraphPlaceholder = await screen.findByLabelText(
			'Add paragraph block'
		);
		expect( paragraphPlaceholder ).toBeDefined();
		fireEvent.press( paragraphPlaceholder );

		// Wait for the block to be created
		const [ paragraphBlock ] = await screen.findAllByLabelText(
			/Paragraph Block\. Row 1/
		);
		expect( paragraphBlock ).toBeDefined();

		// Look for the highlight text color button
		const textColorButton = await screen.findByLabelText( 'Text color' );
		expect( textColorButton ).toBeDefined();
		fireEvent.press( textColorButton );

		// Wait for Inline color modal to be visible
		const inlineTextColorModal = screen.getByTestId(
			'inline-text-color-modal'
		);
		await waitFor( () => inlineTextColorModal.props.isVisible );

		// Look for the pink color button
		const pinkColorButton = await screen.findByA11yHint( COLOR_PINK );
		expect( pinkColorButton ).toBeDefined();
		fireEvent.press( pinkColorButton );
		// TODO(jest-console): Fix the warning and remove the expect below.
		expect( console ).toHaveWarnedWith(
			`Non-serializable values were found in the navigation state. Check:\n\ntext-color > Palette > params.onColorChange (Function)\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'allows toggling the highlight color feature to selected text', async () => {
		const screen = await initializeEditor();
		const text = 'Hello this is a test';

		// Wait for the editor placeholder
		const paragraphPlaceholder = await screen.findByLabelText(
			'Add paragraph block'
		);
		expect( paragraphPlaceholder ).toBeDefined();
		fireEvent.press( paragraphPlaceholder );

		// Wait for the block to be created
		const [ paragraphBlock ] = await screen.findAllByLabelText(
			/Paragraph Block\. Row 1/
		);
		expect( paragraphBlock ).toBeDefined();

		// Update TextInput value
		const paragraphText = screen.getByPlaceholderText( 'Start writing…' );
		fireEvent( paragraphText, 'onSelectionChange', 0, text.length, text, {
			nativeEvent: {
				eventCount: 1,
				target: undefined,
				text,
			},
		} );

		// Look for the highlight text color button
		const textColorButton = await screen.findByLabelText( 'Text color' );
		expect( textColorButton ).toBeDefined();
		fireEvent.press( textColorButton );

		// Wait for Inline color modal to be visible
		const inlineTextColorModal = screen.getByTestId(
			'inline-text-color-modal'
		);
		await waitFor( () => inlineTextColorModal.props.isVisible );

		// Look for the pink color button
		const pinkColorButton = await screen.findByA11yHint( COLOR_PINK );
		expect( pinkColorButton ).toBeDefined();
		fireEvent.press( pinkColorButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'creates a paragraph block with the text color format', async () => {
		const screen = await initializeEditor( {
			initialHtml: TEXT_WITH_COLOR,
		} );

		// Wait for the block to be created
		const [ paragraphBlock ] = await screen.findAllByLabelText(
			/Paragraph Block\. Row 1/
		);
		expect( paragraphBlock ).toBeDefined();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'supports old text color format using "span" tag', async () => {
		await initializeEditor( {
			initialHtml: `<!-- wp:paragraph -->
			<p>this <span class="has-inline-color has-green-color">is</span> <span class="has-inline-color has-red-color">test</span></p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph -->
			<p><span style="color:#08a5e9" class="has-inline-color">this is a test</span></p>
			<!-- /wp:paragraph -->`,
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
