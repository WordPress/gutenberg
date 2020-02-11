/**
 * External dependencies
 */
/* eslint-disable import/no-extraneous-dependencies */
import { boolean, text } from '@storybook/addon-knobs';
/* eslint-enable import/no-extraneous-dependencies */

/**
 * Internal dependencies
 */
import Card from '../index';
import CardHeader from '../header';
import { getCardStoryProps } from './_utils';

export default { title: 'Components/Card/Header', component: CardHeader };

export const _default = () => {
	const props = getCardStoryProps();
	const content = text( 'Footer: children', 'Content' );
	const isShady = boolean( 'Footer: isShady', false );

	return (
		<Card { ...props }>
			<CardHeader isShady={ isShady }>{ content }</CardHeader>
		</Card>
	);
};
