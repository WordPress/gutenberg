import renderer from 'react-test-renderer';
import Paragraph from '../../gutenberg/packages/block-library/src/paragraph/edit.native.js';
import RCTAztecView from '../../gutenberg/packages/editor/src/components/rich-text/index.native.js';
//import { RichText } from '@wordpress/editor';

describe( 'Paragraph', () => {

	it( 'renders without crashing', () => {
		const component = renderer.create( <Paragraph attributes={ { content: "" } } /> );
        const rendered = component.toJSON();
        console.log( 'first logs: ' );
        //console.log( rendered );
		expect( rendered ).toBeTruthy();
	} );

	it( 'splits without crashing', () => {
        const component = renderer.create( <Paragraph attributes={ { content: "sample text" } } /> );
        
        const testInstance = component.root;

    /*  testInstance.instance.splitBlock( null, null, null );
        const textInput = testInstance.findByType( RichText );
        console.log(textInput);
		expect( textInput ).toBeTruthy();
		expect( textInput.props.value ).toBe( "sample text" );*/
	} );

} );
