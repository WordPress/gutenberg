/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import blockCompleter, { createBlockCompleter } from '../block';

describe( 'block', () => {
	it( 'should retrieve block options for current insertion point', () => {
		const expectedOptions = [ {}, {}, {} ];
		const mockGetBlockInsertionPoint = jest.fn( () => 'expected-insertion-point' );
		const mockGetInserterItems = jest.fn( () => expectedOptions );

		const completer = createBlockCompleter( {
			getBlockInsertionPoint: mockGetBlockInsertionPoint,
			getInserterItems: mockGetInserterItems,
		} );

		const actualOptions = completer.options();
		expect( mockGetBlockInsertionPoint ).toHaveBeenCalled();
		expect( mockGetInserterItems ).toHaveBeenCalledWith( 'expected-insertion-point' );
		expect( actualOptions ).toBe( expectedOptions );
	} );

	it( 'should derive option keywords from block keywords and block title', () => {
		const inserterItemWithTitleAndKeywords = {
			name: 'core/foo',
			title: 'foo',
			keywords: [ 'foo-keyword-1', 'foo-keyword-2' ],
		};
		const inserterItemWithTitleAndEmptyKeywords = {
			name: 'core/bar',
			title: 'bar',
			// Intentionally empty keyword list
			keywords: [],
		};
		const inserterItemWithTitleAndUndefinedKeywords = {
			name: 'core/baz',
			title: 'baz',
			// Intentionally omitted keyword list
		};

		expect( blockCompleter.getOptionKeywords( inserterItemWithTitleAndKeywords ) )
			.toEqual( [ 'foo-keyword-1', 'foo-keyword-2', 'foo' ] );
		expect( blockCompleter.getOptionKeywords( inserterItemWithTitleAndEmptyKeywords ) )
			.toEqual( [ 'bar' ] );
		expect( blockCompleter.getOptionKeywords( inserterItemWithTitleAndUndefinedKeywords ) )
			.toEqual( [ 'baz' ] );
	} );

	it( 'should render a block option label', () => {
		const labelComponents = shallow( <div>
			{ blockCompleter.getOptionLabel( {
				icon: {
					src: 'expected-icon',
				},
				title: 'expected-text',
			} ) }
		</div> ).children();

		expect( labelComponents ).toHaveLength( 2 );
		expect( labelComponents.at( 0 ).name() ).toBe( 'BlockIcon' );
		expect( labelComponents.at( 0 ).prop( 'icon' ) ).toBe( 'expected-icon' );
		expect( labelComponents.at( 1 ).text() ).toBe( 'expected-text' );
	} );

	it( 'should derive isOptionDisabled from the item\'s isDisabled', () => {
		const disabledInserterItem = {
			name: 'core/foo',
			title: 'foo',
			keywords: [ 'foo-keyword-1', 'foo-keyword-2' ],
			isDisabled: true,
		};
		const enabledInserterItem = {
			name: 'core/bar',
			title: 'bar',
			keywords: [],
			isDisabled: false,
		};

		expect( blockCompleter.isOptionDisabled( disabledInserterItem ) ).toBe( true );
		expect( blockCompleter.isOptionDisabled( enabledInserterItem ) ).toBe( false );
	} );
} );
