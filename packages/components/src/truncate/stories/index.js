/**
 * Internal dependencies
 */
import Truncate from '../index';

export default {
	component: Truncate,
	title: 'Components/Truncate',
};

export const _default = () => {
	return (
		<Truncate numberOfLines={ 2 }>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
			facilisis dictum tortor, eu tincidunt justo scelerisque tincidunt.
			Duis semper dui id augue malesuada, ut feugiat nisi aliquam.
			Vestibulum venenatis diam sem, finibus dictum massa semper in. Nulla
			facilisi. Nunc vulputate faucibus diam, in lobortis arcu ornare vel.
			In dignissim nunc sed facilisis finibus. Etiam imperdiet mattis
			arcu, sed rutrum sapien blandit gravida. Aenean sollicitudin neque
			eget enim blandit, sit amet rutrum leo vehicula. Nunc malesuada
			ultricies eros ut faucibus. Aliquam erat volutpat. Nulla nec feugiat
			risus. Vivamus iaculis dui aliquet ante ultricies feugiat.
			Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
			posuere cubilia curae; Vivamus nec pretium velit, sit amet
			consectetur ante. Praesent porttitor ex eget fermentum mattis.
		</Truncate>
	);
};
