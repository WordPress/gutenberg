
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// `babel-jest` should be doing this instead, but apparently it's not working.
require( 'core-js/modules/es7.object.values' );

Enzyme.configure( { adapter: new Adapter() } );
