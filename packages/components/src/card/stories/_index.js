/**
 * External dependencies
 */
import { text, boolean } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Card from '../index';
import CardBody from '../body';
import CardFooter from '../footer';
import CardHeader from '../header';
import { getCardStoryProps } from './_utils';

export default { title: 'Components/Card', component: Card };

export const _default = () => {
	const props = getCardStoryProps();

	const body = text( 'Body: children', 'Code is Poetry' );
	const isBodyShady = boolean( 'Body: isShady', false );

	const header = text( 'Header: children', 'Header' );
	const isHeaderShady = boolean( 'Header: isShady', false );

	const footer = text( 'Footer: children', 'Footer' );
	const isFooterShady = boolean( 'Footer: isShady', false );

	return (
		<Card { ...props }>
			{ header && (
				<CardHeader isShady={ isHeaderShady }>{ header }</CardHeader>
			) }
			{ body && <CardBody isShady={ isBodyShady }>{ body }</CardBody> }
			{ footer && (
				<CardFooter isShady={ isFooterShady }>{ footer }</CardFooter>
			) }
		</Card>
	);
};
