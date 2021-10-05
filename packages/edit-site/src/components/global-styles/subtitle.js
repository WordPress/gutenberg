/**
 * WordPress dependencies
 */
import { __experimentalHeading as Heading } from '@wordpress/components';

function Subtitle( { children } ) {
	return <Heading level={ 2 }>{ children }</Heading>;
}

export default Subtitle;
