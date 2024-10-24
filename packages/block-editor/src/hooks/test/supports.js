/**
 * Internal dependencies
 */
import {
	hasBlockClassNameSupport,
	hasVariationClassNameSupport,
} from '../supports';

describe( 'hasBlockClassNameSupport', () => {
	const blockName = 'block/name';

	it( 'should default to true', () => {
		const block = {
			name: blockName,
		};
		expect( hasBlockClassNameSupport( block ) ).toBe( true );
	} );

	it( 'should return false if the block does not support className', () => {
		const block = {
			name: blockName,
			supports: {
				className: false,
			},
		};
		expect( hasBlockClassNameSupport( block ) ).toBe( false );
	} );

	it( 'should reflect the nested supports property if true', () => {
		const block = {
			name: blockName,
			supports: {
				className: {
					block: true,
				},
			},
		};
		expect( hasBlockClassNameSupport( block ) ).toBe( true );
	} );

	it( 'should reflect the nested supports property if false', () => {
		const block = {
			name: blockName,
			supports: {
				className: {
					block: false,
				},
			},
		};
		expect( hasBlockClassNameSupport( block ) ).toBe( false );
	} );
} );

describe( 'hasVariationClassNameSupport', () => {
	const blockName = 'block/name';

	it( 'should default to false', () => {
		const block = {
			name: blockName,
		};
		expect( hasVariationClassNameSupport( block ) ).toBe( false );
	} );

	it( 'should return false if the block does not explicitly support variation class names', () => {
		const block = {
			name: blockName,
			supports: {
				className: true,
			},
		};
		expect( hasVariationClassNameSupport( block ) ).toBe( false );
	} );

	it( 'should reflect the nested supports property if true', () => {
		const block = {
			name: blockName,
			supports: {
				className: {
					variation: true,
				},
			},
		};
		expect( hasVariationClassNameSupport( block ) ).toBe( true );
	} );

	it( 'should reflect the nested supports property if false', () => {
		const block = {
			name: blockName,
			supports: {
				className: {
					variation: false,
				},
			},
		};
		expect( hasVariationClassNameSupport( block ) ).toBe( false );
	} );
} );
