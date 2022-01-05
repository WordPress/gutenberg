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
import { registerBlock, coreBlocks } from '@wordpress/block-library';

const COLOR_PINK = '#f78da7';
const paragraph = coreBlocks[ 'core/paragraph' ];

const TEXT_WITH_COLOR = `<!-- wp:paragraph -->
<p>Hello <mark style="background-color:rgba(0,0,0,0);color:#cf2e2e" class="has-inline-color has-vivid-red-color">this is a test</mark></p>
<!-- /wp:paragraph -->`;

beforeAll( () => {
	registerBlock( paragraph );
	setDefaultBlockName( paragraph.name );
} );

afterAll( () => {
	unregisterBlockType( paragraph.name );
} );

describe( 'Text color', () => {
	it( 'shows the text color formatting button in the toolbar', async () => {
		const { getByA11yLabel } = await initializeEditor();

		// Wait for the editor placeholder
		const paragraphPlaceholder = await waitFor( () =>
			getByA11yLabel( 'Add paragraph block' )
		);
		expect( paragraphPlaceholder ).toBeDefined();
		fireEvent.press( paragraphPlaceholder );

		// Wait for the block to be created
		const paragraphBlock = await waitFor( () =>
			getByA11yLabel( /Paragraph Block\. Row 1/ )
		);
		expect( paragraphBlock ).toBeDefined();

		// Look for the highlight text color button
		const textColorButton = await waitFor( () =>
			getByA11yLabel( 'Text color' )
		);
		expect( textColorButton ).toBeDefined();
	} );

	it( 'allows toggling the highlight color feature to type new text', async () => {
		const {
			getByA11yLabel,
			getByTestId,
			getByA11yHint,
		} = await initializeEditor();

		// Wait for the editor placeholder
		const paragraphPlaceholder = await waitFor( () =>
			getByA11yLabel( 'Add paragraph block' )
		);
		expect( paragraphPlaceholder ).toBeDefined();
		fireEvent.press( paragraphPlaceholder );

		// Wait for the block to be created
		const paragraphBlock = await waitFor( () =>
			getByA11yLabel( /Paragraph Block\. Row 1/ )
		);
		expect( paragraphBlock ).toBeDefined();

		// Look for the highlight text color button
		const textColorButton = await waitFor( () =>
			getByA11yLabel( 'Text color' )
		);
		expect( textColorButton ).toBeDefined();
		fireEvent.press( textColorButton );

		// Wait for Inline color modal to be visible
		const inlineTextColorModal = getByTestId( 'inline-text-color-modal' );
		await waitFor( () => inlineTextColorModal.props.isVisible );

		// Look for the pink color button
		const pinkColorButton = await waitFor( () =>
			getByA11yHint( COLOR_PINK )
		);
		expect( pinkColorButton ).toBeDefined();
		fireEvent.press( pinkColorButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'allows toggling the highlight color feature to selected text', async () => {
		const {
			getByA11yLabel,
			getByTestId,
			getByPlaceholderText,
			getByA11yHint,
		} = await initializeEditor();
		const text = 'Hello this is a test';

		// Wait for the editor placeholder
		const paragraphPlaceholder = await waitFor( () =>
			getByA11yLabel( 'Add paragraph block' )
		);
		expect( paragraphPlaceholder ).toBeDefined();
		fireEvent.press( paragraphPlaceholder );

		// Wait for the block to be created
		const paragraphBlock = await waitFor( () =>
			getByA11yLabel( /Paragraph Block\. Row 1/ )
		);
		expect( paragraphBlock ).toBeDefined();

		// Update TextInput value
		const paragraphText = getByPlaceholderText( 'Start writing…' );
		fireEvent( paragraphText, 'onSelectionChange', 0, text.length, text, {
			nativeEvent: {
				eventCount: 1,
				target: undefined,
				text,
			},
		} );

		// Look for the highlight text color button
		const textColorButton = await waitFor( () =>
			getByA11yLabel( 'Text color' )
		);
		expect( textColorButton ).toBeDefined();
		fireEvent.press( textColorButton );

		// Wait for Inline color modal to be visible
		const inlineTextColorModal = getByTestId( 'inline-text-color-modal' );
		await waitFor( () => inlineTextColorModal.props.isVisible );

		// Look for the pink color button
		const pinkColorButton = await waitFor( () =>
			getByA11yHint( COLOR_PINK )
		);
		expect( pinkColorButton ).toBeDefined();
		fireEvent.press( pinkColorButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'creates a paragraph block with the text color format', async () => {
		const { getByA11yLabel } = await initializeEditor( {
			initialHtml: TEXT_WITH_COLOR,
		} );

		// Wait for the block to be created
		const paragraphBlock = await waitFor( () =>
			getByA11yLabel( /Paragraph Block\. Row 1/ )
		);
		expect( paragraphBlock ).toBeDefined();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
