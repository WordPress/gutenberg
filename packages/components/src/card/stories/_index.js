/**
 * External dependencies
 */

/* eslint-disable import/no-extraneous-dependencies */
import { text, boolean } from '@storybook/addon-knobs';
/* eslint-enable import/no-extraneous-dependencies */

/**
 * Internal dependencies
 */
import Card from '../index';
import CardBody from '../body';
import CardFooter from '../footer';
import CardHeader from '../header';
import { getCardStoryProps } from './__utils';

export default { title: 'Card', component: Card };

export const _default = () => {
	const props = getCardStoryProps();

	const body = text( 'Body/Content', 'Code is Poetry' );
	const isBodyShady = boolean( 'Body/Shady', false );

	const header = text( 'Header/Content', 'Header' );
	const isHeaderShady = boolean( 'Header/Shady', false );

	const footer = text( 'Footer/Content', 'Footer' );
	const isFooterShady = boolean( 'Footer/Shady', false );

	return (
		<>
			<Card { ...props }>
				{ header && (
					<CardHeader isShady={ isHeaderShady }>{ header }</CardHeader>
				) }
				{ body && <CardBody isShady={ isBodyShady }>{ body }</CardBody> }
				{ footer && (
					<CardFooter isShady={ isFooterShady }>{ footer }</CardFooter>
				) }
			</Card>
		</>
	);
};
