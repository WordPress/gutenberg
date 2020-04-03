/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import * as data from '@wordpress/data';
import * as blockLibrary from '@wordpress/block-library';
import * as blocks from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import HeadingToolbar from '../heading-toolbar';
import HeadingEdit from '../edit';

const blockEditorSelect = data.select( 'core/block-editor' );
const blockEditorDispatch = data.dispatch( 'core/block-editor' );

const testAttributes = {
	content: 'Heading block',
	level: 4,
	align: 'center',
	style: { color: { text: '#003fa3' } },
};

describe( 'Heading', () => {
	beforeAll( () => {
		blockLibrary.registerCoreBlocks();
		gutenbergSetup();
		blockEditorDispatch.removeBlocks( blockEditorSelect.getBlocks() );
	} );

	it( 'Serializes all Heading attributes properly', () => {
		const expectedHTML = `<!-- wp:heading {"align":"center","level":4,"style":{"color":{"text":"#003fa3"}}} -->
<h4 class="has-text-align-center has-text-color" style="--wp--color--text:#003fa3">Heading block</h4>
<!-- /wp:heading -->`;

		insertHeadingBlockWithAttributes( testAttributes );

		const finalHTML = blocks.serialize( blockEditorSelect.getBlocks() );

		expect( finalHTML ).toEqual( expect.stringContaining( expectedHTML ) );
	} );

	it( 'Parse Heading attributes from HTML properly', () => {
		const expectedHTML = `<!-- wp:heading {"align":"center","level":4,"style":{"color":{"text":"#003fa3"}}} -->
<h4 class="has-text-align-center has-text-color" style="--wp--color--text:#003fa3">Heading block</h4>
<!-- /wp:heading -->`;

		const parsedBlocks = blocks.parse( expectedHTML );

		expect( parsedBlocks[ 0 ].attributes ).toEqual( testAttributes );
	} );

	it( 'Changes Heading level via HeaderToolBar ', () => {
		const expectedHTML = `<!-- wp:heading {"level":4} -->
<h4>Heading block</h4>
<!-- /wp:heading -->`;

		const attributes = {
			content: 'Heading block',
		};

		const headingEdit = createHeadingEdit( attributes );
		headingEdit
			.find( HeadingToolbar )
			.props()
			.onChange( 4 );

		const finalHTML = blocks.serialize( blockEditorSelect.getBlocks() );

		expect( finalHTML ).toEqual( expect.stringContaining( expectedHTML ) );
	} );
} );

const gutenbergSetup = () => {
	const userId = 1;
	const storageKey = 'WP_DATA_USER_' + userId;
	data.use( data.plugins.persistence, { storageKey } );
};

const insertHeadingBlockWithAttributes = ( attributes = {}, index = 0 ) => {
	const headingBlock = blocks.createBlock( 'core/heading', attributes );
	blockEditorDispatch.insertBlock( headingBlock, index );

	const renderedBlocks = blockEditorSelect.getBlocks();
	return renderedBlocks[ index ];
};

const createHeadingEdit = ( attributes ) => {
	const renderedHeadingBlock = insertHeadingBlockWithAttributes( attributes );

	const setAttributes = ( attr ) => {
		blockEditorDispatch.updateBlockAttributes(
			renderedHeadingBlock.clientId,
			attr
		);
	};

	return shallow(
		<HeadingEdit
			attributes={ renderedHeadingBlock.attributes }
			setAttributes={ setAttributes }
			onReplace={ jest.fn() }
			mergeBlocks={ jest.fn() }
		/>
	);
};
