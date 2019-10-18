/**
 * Internal dependencies
 */
import ScreenReaderText from '../';

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
