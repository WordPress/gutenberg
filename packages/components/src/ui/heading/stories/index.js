/**
 * Internal dependencies
 */
import { Heading } from '../index';

export default {
	component: Heading,
	title: 'G2 Components (Experimental)/Heading',
};

export const _default = () => {
	return (
		<>
			<Heading size={ 1 }>Heading</Heading>
			<Heading size={ 2 }>Heading</Heading>
			<Heading size={ 3 }>Heading</Heading>
			<Heading size={ 4 }>Heading</Heading>
			<Heading size={ 5 }>Heading</Heading>
			<Heading size={ 6 }>Heading</Heading>
		</>
	);
};
