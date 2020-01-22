/**
 * Internal dependencies
 */
import Icon from '../';
import check from '../../library/check';
import paragraph from '../../library/paragraph';

export default { title: 'Icons/Icon', component: Icon };

export const _default = () => {
	return (
		<>
			<div>
				<h2>Dashicons (corrected viewport)</h2>

				<Icon icon={ check } />
				<Icon icon={ check } size={ 36 } />
				<Icon icon={ check } size={ 48 } />
			</div>
			<div>
				<h2>Material and Other</h2>

				<Icon icon={ paragraph } />
				<Icon icon={ paragraph } size={ 36 } />
				<Icon icon={ paragraph } size={ 48 } />
			</div>
		</>
	);
};
