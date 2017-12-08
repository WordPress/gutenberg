/**
 * Internal dependencies
 */
import { MultiBlocksSwitcher, mapStateToProps } from '../multi-blocks-switcher';

describe( 'MultiBlocksSwitcher', () => {
	test( 'should return null when the selection is not a multi block selection.', () => {
		const isMultiBlockSelection = false;
		const selectedBlockUids = [
			'an-uid',
		];

		expect( MultiBlocksSwitcher( { isMultiBlockSelection, selectedBlockUids } ) ).toBe( null );
	} );

	test( 'should return a BlockSwitcher element matching the snapshot.', () => {
		const isMultiBlockSelection = true;
		const selectedBlockUids = [
			'an-uid',
			'another-uid',
		];

		expect( MultiBlocksSwitcher( { isMultiBlockSelection, selectedBlockUids } ) ).toMatchSnapshot();
	} );

	describe( 'mapStateToProps', () => {
		test( 'should return the expected selected block uids and whether there is a multiselection.', () => {
			const start = 'an-uid';
			const end = 'another-uid';
			const selectedBlockUids = [ start, end ];
			const state = {
				editor: {
					present: {
						blockOrder: selectedBlockUids,
					},
				},
				blockSelection: {
					start,
					end,
				},
			};

			const expected = {
				isMultiBlockSelection: true,
				selectedBlockUids,
			};

			expect( mapStateToProps( state ) ).toEqual( expected );
		} );
	} );
} );
