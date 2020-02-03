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
import CardFooter from '../footer';
import { getCardStoryProps } from './_utils';

export default { title: 'Components/Card/Footer', component: CardFooter };

export const _default = () => {
	const props = getCardStoryProps();
	const content = text( 'Footer: children', 'Content' );
	const isShady = boolean( 'Footer: isShady', false );

	return (
		<Card { ...props }>
			<CardFooter isShady={ isShady }>{ content }</CardFooter>
		</Card>
	);
};
