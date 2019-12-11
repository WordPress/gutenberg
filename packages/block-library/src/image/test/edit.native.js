/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { ImageEdit } from '../edit';
import { NEW_TAB_REL } from '../constants';

const getStylesFromColorScheme = () => {
	return { color: 'white' };
};

const setAttributes = jest.fn();

const getImageComponent = ( attributes = { } ) => (
	<ImageEdit
		setAttributes={ setAttributes }
		attributes={ attributes }
		getStylesFromColorScheme={ getStylesFromColorScheme }
	/>
);

describe( 'Image Block', () => {
	beforeEach( () => {
		setAttributes.mockReset();
	} );

	it( 'renders without crashing', () => {
		const component = renderer.create( getImageComponent() );
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'sets link target', () => {
		const component = renderer.create( getImageComponent() );
		const instance = component.getInstance();

		instance.onSetNewTab( true );

		expect( setAttributes ).toHaveBeenCalledWith( { linkTarget: '_blank', rel: undefined } );
	} );

	it( 'unset link target', () => {
		const component = renderer.create( getImageComponent( { linkTarget: '_blank', rel: NEW_TAB_REL.join( ' ' ) } ) );
		const instance = component.getInstance();

		instance.onSetNewTab( false );

		expect( setAttributes ).toHaveBeenCalledWith( { linkTarget: undefined, rel: undefined } );
	} );
} );

