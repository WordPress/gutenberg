/**
 * Internal dependencies
 */
import ScreenReaderText from '../';
import '../style.scss';

export default { title: 'ScreenReaderText', component: ScreenReaderText };

export const _default = () => (
	<>
		<ScreenReaderText>
			This should not show.
		</ScreenReaderText>
		<div>
			This text will always show.
		</div>
	</>
);
