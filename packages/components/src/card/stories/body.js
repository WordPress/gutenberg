/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Card } from '../';
import CardBody from '../body';
import { getCardStoryProps } from './_utils';

export default { title: 'Components/Card/Body', component: CardBody };

export const _default = () => {
	const props = getCardStoryProps();
	const content = text( 'Body: children', 'Content' );
	const isShady = boolean( 'Body: isShady', false );

	return (
		<Card { ...props }>
			<CardBody isShady={ isShady }>{ content }</CardBody>
		</Card>
	);
};
