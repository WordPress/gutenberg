/**
 * External dependencies
 */
import { number, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Dashicon from '../';

export default { title: 'Components/Dashicon', component: Dashicon };

export const _default = () => {
	const icon = text( 'Icon', 'wordpress' );
	const color = text( 'Color', '#0079AA' );
	const size = number( 'Size', 20 );

	return <Dashicon icon={ icon } color={ color } size={ size } />;
};
