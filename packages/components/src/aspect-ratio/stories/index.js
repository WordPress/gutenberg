/**
 * Internal dependencies
 */
import { AspectRatio } from '../index';

export default {
	component: AspectRatio,
	title: 'Components/AspectRatio',
};

export const _default = () => {
	return (
		<AspectRatio css={ { width: 400 } } ratio={ 16 / 9 }>
			<img alt="random" src="https://cldup.com/cXyG__fTLN.jpg" />
		</AspectRatio>
	);
};
