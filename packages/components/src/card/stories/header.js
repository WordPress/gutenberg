/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Card from '../index';
import CardHeader from '../header';
import Button from '../../button';
import { FlexBlock, FlexItem } from '../../flex';
import { getCardStoryProps } from './_utils';

export default { title: 'Components/Card/Header', component: CardHeader };

export const _default = () => {
	const props = getCardStoryProps();
	const content = text( 'Header: children', 'Content' );
	const isShady = boolean( 'Header: isShady', false );

	return (
		<Card { ...props }>
			<CardHeader isShady={ isShady }>{ content }</CardHeader>
		</Card>
	);
};

export const alignment = () => {
	const props = getCardStoryProps();
	const content = text( 'Header: children', 'Content' );
	const isShady = boolean( 'Header: isShady', false );

	return (
		<Card { ...props }>
			<CardHeader isShady={ isShady }>
				<FlexBlock>{ content }</FlexBlock>
				<FlexItem>
					<Button variant="primary">Action</Button>
				</FlexItem>
			</CardHeader>
		</Card>
	);
};
