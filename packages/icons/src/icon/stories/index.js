/**
 * Internal dependencies
 */
import Icon from '../';
import saved from '../../library/saved';
import paragraph from '../../library/paragraph';

export default { title: 'Icons/Icon', component: Icon };

export const _default = () => {
	return (
		<>
			<Icon icon={ saved } />
			<Icon icon={ paragraph } />
		</>
	);
};
