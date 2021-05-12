/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { Button } from '..';

// The full module mock is necessary to avoid test failures related to
// calling `console` methods
jest.mock( '@wordpress/deprecated', () => {
	return {
		__esModule: true,
		default: jest.fn(),
	};
} );

describe( 'Button', () => {
	describe( 'deprecated props', () => {
		afterEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should warn when the isPrimary prop is passed', () => {
			const button = shallow( <Button isPrimary /> ).find( 'button' );
			expect( button.hasClass( 'is-primary' ) ).toBe( true );

			expect( deprecated ).toHaveBeenCalledTimes( 1 );
			expect( deprecated ).toHaveBeenCalledWith(
				'Button isPrimary prop',
				{
					alternative: 'variant="primary"',
					since: '5.9',
				}
			);
		} );

		it( 'should warn when the isSecondary prop is passed', () => {
			const button = shallow( <Button isSecondary /> ).find( 'button' );
			expect( button.hasClass( 'is-secondary' ) ).toBe( true );

			expect( deprecated ).toHaveBeenCalledTimes( 1 );
			expect( deprecated ).toHaveBeenCalledWith(
				'Button isSecondary prop',
				{
					alternative: 'variant="secondary"',
					since: '5.9',
				}
			);
		} );

		it( 'should warn when the isTertiary prop is passed', () => {
			const button = shallow( <Button isTertiary /> ).find( 'button' );
			expect( button.hasClass( 'is-tertiary' ) ).toBe( true );

			expect( deprecated ).toHaveBeenCalledTimes( 1 );
			expect( deprecated ).toHaveBeenCalledWith(
				'Button isTertiary prop',
				{
					alternative: 'variant="tertiary"',
					since: '5.9',
				}
			);
		} );

		it( 'should warn when the isLink prop is passed', () => {
			const button = shallow( <Button isLink /> ).find( 'button' );
			expect( button.hasClass( 'is-link' ) ).toBe( true );

			expect( deprecated ).toHaveBeenCalledTimes( 1 );
			expect( deprecated ).toHaveBeenCalledWith( 'Button isLink prop', {
				alternative: 'variant="link"',
				since: '5.9',
			} );
		} );

		it( 'should warn when the isDefault prop is passed', () => {
			const button = shallow( <Button isDefault /> ).find( 'button' );
			expect( button.hasClass( 'is-secondary' ) ).toBe( true );

			expect( deprecated ).toHaveBeenCalledTimes( 1 );
			expect( deprecated ).toHaveBeenCalledWith(
				'Button isDefault prop',
				{
					alternative: 'variant="secondary"',
					since: '5.4',
				}
			);
		} );
	} );
} );
