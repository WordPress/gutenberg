/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';
import faker from 'faker';
/**
 * Internal dependencies
 */
import PageHeader from '../';

export default { title: 'PageHeader', component: PageHeader };

export const _default = () => {
	const title = text( 'title', faker.lorem.sentence() );
	const subtitle = text( 'subtitle', faker.lorem.paragraph() );

	const props = {
		title,
		subtitle,
	};

	return <PageHeader { ...props } />;
};
