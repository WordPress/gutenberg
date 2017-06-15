/**
 * External dependencies
 */
import { expect } from 'chai';
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import withInstanceId from '../';

describe( 'withInstanceId', () => {
	const DumpComponent = withInstanceId( ( { instanceId } ) => {
		return <div>{ instanceId }</div>;
	} );

	it( 'should generate a new instanceId for each instance', () => {
		const dumb1 = render( <DumpComponent /> );
		const dumb2 = render( <DumpComponent /> );
		// Unrendered element.
		expect( dumb1.text() ).to.not.equal( dumb2.text() );
	} );
} );
