/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getAllBlocks,
	multiSelectBlocksByIds,
	multiSelectBlocksByRange,
	insertBlock,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

const createTestParagraphBlocks = async ( paragraphBlocks ) => {
	const paragraph = 'Paragraph';
	for ( const paragraphBlock of paragraphBlocks ) {
		await insertBlock( paragraph );
		await page.keyboard.type( `${ paragraphBlock } ${ paragraph }` );
	}
};

const getBlocksInfo = async () =>
	( await getAllBlocks() ).map( ( { clientId } ) => clientId );

describe( 'block editor keyboard shortcuts', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	describe( 'move blocks', () => {
		const moveUp = async () => pressKeyWithModifier( 'primaryAlt', 'q' );
		const moveDown = async () => pressKeyWithModifier( 'primaryAlt', 'w' );
		const paragraphBlocks = [ 'First', 'Second', 'Third' ];
		describe( 'single block selected', () => {
			it( 'should move the block up', async () => {
				await createTestParagraphBlocks( paragraphBlocks );
				const [ , , third ] = await getBlocksInfo();
				await page.focus( `.wp-block[data-block="${ third }"]` ); // Select second block
				await Promise.all( [ moveUp(), moveUp() ] ); // press twice
				const [ first ] = await getBlocksInfo();
				expect( third ).toBe( first );
			} );

			it( 'should move the block down', async () => {
				await createTestParagraphBlocks( paragraphBlocks );
				const [ first ] = await getBlocksInfo();
				await page.focus( `.wp-block[data-block="${ first }"]` ); // Select first block
				await moveDown();
				const [ , second ] = await getBlocksInfo();
				expect( second ).toBe( first );
			} );
		} );

		describe( 'multiple blocks selected', () => {
			it( 'should move the blocks up', async () => {
				await createTestParagraphBlocks( paragraphBlocks );
				const [ , secondBefore, thirdBefore ] = await getBlocksInfo();
				await multiSelectBlocksByRange( 2, 2 ); // from second block select 2 blocks ( 2, 3 )
				await moveUp();
				const [ firstAfter, secondAfter ] = await getBlocksInfo();
				expect( firstAfter ).toBe( secondBefore );
				expect( secondAfter ).toBe( thirdBefore );
			} );

			it( 'should move the blocks down', async () => {
				await createTestParagraphBlocks( paragraphBlocks );
				const [
					firstBefore,
					secondBefore,
					thirdBefore,
				] = await getBlocksInfo();
				await multiSelectBlocksByIds( firstBefore, secondBefore );
				await moveDown();
				const [
					firstAfter,
					secondAfter,
					thirdAfter,
				] = await getBlocksInfo();
				expect( firstAfter ).toBe( thirdBefore );
				expect( secondAfter ).toBe( firstBefore );
				expect( thirdAfter ).toBe( secondBefore );
			} );
		} );
	} );
} );
