/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	InheritedValueContext,
	getPushDestinationPath,
	useStylePushHandlers,
} from '../inherited-value-context';

function setupPushFactory( value, contextValue ) {
	const wrapper = ( { children } ) =>
		contextValue ? (
			<InheritedValueContext.Provider value={ contextValue }>
				{ children }
			</InheritedValueContext.Provider>
		) : (
			children
		);
	return renderHook( () => useStylePushHandlers( value ), { wrapper } ).result
		.current;
}

describe( 'useStylePushHandlers', () => {
	const value = { typography: { fontSize: '20px' } };

	test( 'returns undefined handlers when no Provider is mounted', () => {
		const getPushHandler = setupPushFactory( value, null );
		expect(
			getPushHandler( [ [ 'typography', 'fontSize' ] ] )
		).toBeUndefined();
	} );

	test( 'returns undefined handlers when pushing is not allowed', () => {
		const getPushHandler = setupPushFactory( value, {
			canPushToGlobalStyles: false,
			pushIndividualStyle: jest.fn(),
		} );
		expect(
			getPushHandler( [ [ 'typography', 'fontSize' ] ] )
		).toBeUndefined();
	} );

	test( 'pushes every defined path and then runs the reset', () => {
		const pushIndividualStyle = jest.fn();
		const onReset = jest.fn();
		const getPushHandler = setupPushFactory(
			{ spacing: { padding: { top: '1rem' } }, color: { text: '#000' } },
			{ canPushToGlobalStyles: true, pushIndividualStyle }
		);

		const handler = getPushHandler(
			[
				[ 'spacing', 'padding' ],
				[ 'color', 'text' ],
			],
			onReset
		);
		expect( handler ).toBeInstanceOf( Function );

		handler();
		expect( pushIndividualStyle ).toHaveBeenCalledTimes( 2 );
		expect( pushIndividualStyle ).toHaveBeenCalledWith(
			[ 'spacing', 'padding' ],
			{ top: '1rem' }
		);
		expect( pushIndividualStyle ).toHaveBeenCalledWith(
			[ 'color', 'text' ],
			'#000'
		);
		expect( onReset ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'skips paths without a local value', () => {
		const pushIndividualStyle = jest.fn();
		const getPushHandler = setupPushFactory( value, {
			canPushToGlobalStyles: true,
			pushIndividualStyle,
		} );

		const handler = getPushHandler( [
			[ 'typography', 'fontSize' ],
			[ 'typography', 'lineHeight' ],
		] );
		handler();
		expect( pushIndividualStyle ).toHaveBeenCalledTimes( 1 );
		expect( pushIndividualStyle ).toHaveBeenCalledWith(
			[ 'typography', 'fontSize' ],
			'20px'
		);
	} );

	test( 'returns undefined when no supplied path has a local value', () => {
		const getPushHandler = setupPushFactory( value, {
			canPushToGlobalStyles: true,
			pushIndividualStyle: jest.fn(),
		} );
		expect(
			getPushHandler( [ [ 'typography', 'lineHeight' ] ] )
		).toBeUndefined();
	} );
} );

describe( 'getPushDestinationPath', () => {
	test( 'targets the block base default when no variation is active', () => {
		expect(
			getPushDestinationPath( 'core/heading', null, [
				'typography',
				'fontSize',
			] )
		).toEqual( [ 'blocks', 'core/heading', 'typography', 'fontSize' ] );
	} );

	test( "targets the active variation's default when one is being edited", () => {
		expect(
			getPushDestinationPath( 'core/quote', 'plain', [ 'color', 'text' ] )
		).toEqual( [
			'blocks',
			'core/quote',
			'variations',
			'plain',
			'color',
			'text',
		] );
	} );

	test( 'preserves element-scoped sub-paths', () => {
		expect(
			getPushDestinationPath( 'core/heading', 'fancy', [
				'elements',
				'link',
				'color',
				'text',
			] )
		).toEqual( [
			'blocks',
			'core/heading',
			'variations',
			'fancy',
			'elements',
			'link',
			'color',
			'text',
		] );
	} );
} );
