/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import useContainerMatch from '../';

const TestComponent = ( { query } ) => {
	const [ matches, onLayout ] = useContainerMatch( query );

	return <View onLayout={ onLayout } matches={ matches } />;
};

const renderWithOnLayout = ( component ) => {
	const testComponent = create( component );

	const mockNativeEvent = {
		nativeEvent: {
			layout: {
				width: 300,
			},
		},
	};

	act( () => {
		testComponent.toJSON().props.onLayout( mockNativeEvent );
	} );

	return testComponent.toJSON();
};

describe( 'useContainerMatch()', () => {
	it( 'should return "{ isSmall: false }"', () => {
		const component = renderWithOnLayout(
			<TestComponent query={ { isSmall: '< 200' } } />
		);
		expect( component.props.matches ).toMatchObject( { isSmall: false } );
	} );

	it( 'should return "{ isMedium: true }"', () => {
		const component = renderWithOnLayout(
			<TestComponent query={ { isMedium: '> 250' } } />
		);
		expect( component.props.matches ).toMatchObject( { isMedium: true } );
	} );

	it( 'should return "{ isSmall: false, isMedium: true, isLarge: false }"', () => {
		const component = renderWithOnLayout(
			<TestComponent
				query={ {
					isSmall: '< 200',
					isMedium: '> 250',
					isLarge: '> 400',
				} }
			/>
		);
		expect( component.props.matches ).toMatchObject( {
			isSmall: false,
			isMedium: true,
			isLarge: false,
		} );
	} );

	it( 'should return "{ isMedium: true }" using default operator', () => {
		const component = renderWithOnLayout(
			<TestComponent query={ { isMedium: '200' } } />
		);
		expect( component.props.matches ).toMatchObject( { isMedium: true } );
	} );
} );
