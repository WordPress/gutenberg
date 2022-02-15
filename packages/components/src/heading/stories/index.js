/**
 * Internal dependencies
 */
import { Heading } from '../';
import { Heading as UnconnectedHeading } from '../component';

export default {
	component: UnconnectedHeading,
	title: 'Components (Experimental)/Heading',
};

export const _default = () => {
	return (
		<>
			<Heading level={ 1 } uppercase>
				Heading
			</Heading>
			<Heading level={ 2 }>Heading</Heading>
			<Heading level={ 3 }>Heading</Heading>
			<Heading level={ 4 }>Heading</Heading>
			<Heading level={ 5 }>Heading</Heading>
			<Heading level={ 6 }>Heading</Heading>
		</>
	);
};
