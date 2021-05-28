/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Card from '../index';
import CardFooter from '../footer';
import Button from '../../button';
import { FlexBlock, FlexItem } from '../../flex';
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

export const alignment = () => {
	const props = getCardStoryProps();
	const content = text( 'Footer: children', 'Content' );
	const isShady = boolean( 'Footer: isShady', false );

	return (
		<Card { ...props }>
			<CardFooter isShady={ isShady }>
				<FlexBlock>{ content }</FlexBlock>
				<FlexItem>
					<Button variant="primary">Action</Button>
				</FlexItem>
			</CardFooter>
		</Card>
	);
};
