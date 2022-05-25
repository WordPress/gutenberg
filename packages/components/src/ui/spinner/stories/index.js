/**
 * Internal dependencies
 */
import { Spinner } from '../index';

export default {
	component: Spinner,
	title: 'Components (Experimental)/Spinner',
};

export const _default = () => {
	return (
		<>
			<Spinner />
			<Spinner size={ 30 } />
			<Spinner color="blue" size="50" />
		</>
	);
};
