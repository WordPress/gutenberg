/**
 * External dependencies
 */
import {
	fireEvent,
	getBlock,
	getEditorHtml,
	initializeEditor,
	openBlockActionsMenu,
	setupCoreBlocks,
	triggerBlockListLayout,
} from 'test/helpers';

const block = 'Paragraph';
const initialHtml = `
<!-- wp:paragraph -->
<p>Example text</p>
<!-- /wp:paragraph -->`;

// NOTE: Paragraph block can be transformed to Buttons block in web,
// however this transform is not supported in the native version.
const transformsWithInnerBlocks = [ 'List', 'Quote', 'Columns', 'Group' ];
const blockTransforms = [
	'Heading',
	'Preformatted',
	'Pullquote',
	'Verse',
	...transformsWithInnerBlocks,
];

setupCoreBlocks();

describe( `${ block } block transforms`, () => {
	test.each( blockTransforms )(
		'to %s block',
		async ( blockTransformation ) => {
			const screen = await initializeEditor( { initialHtml } );
			const { getByText } = screen;
			fireEvent.press( getBlock( screen, block ) );

			await openBlockActionsMenu( screen );
			fireEvent.press( getByText( 'Transform block…' ) );
			fireEvent.press( getByText( blockTransformation ) );

			const newBlock = getBlock( screen, blockTransformation );
			if ( transformsWithInnerBlocks.includes( blockTransformation ) )
				await triggerBlockListLayout( newBlock );

			expect( newBlock ).toBeVisible();
			expect( getEditorHtml() ).toMatchSnapshot();
		}
	);
} );
