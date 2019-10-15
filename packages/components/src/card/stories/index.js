/**
 * External dependencies
 */

/* eslint-disable import/no-extraneous-dependencies */
import { text, boolean, select } from '@storybook/addon-knobs';
/* eslint-enable import/no-extraneous-dependencies */

/**
 * Internal dependencies
 */
import Card from '../index';
import CardBody from '../body';
import CardDivider from '../divider';
import CardFooter from '../footer';
import CardHeader from '../header';
import CardMedia from '../media';

export default { title: 'Card', component: Card };

export const _default = () => (
	<Card>
		<CardBody>Code is Poetry</CardBody>
	</Card>
);

export const media = () => {
	return (
		<div>
			<Card style={ { width: 360 } } size="sm">
				<CardMedia>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</CardMedia>
				<CardBody>
					<div>Content</div>
				</CardBody>
			</Card>
			<br />

			<Card style={ { width: 360 } } size="sm">
				<CardHeader>
					<div>Content</div>
				</CardHeader>
				<CardMedia>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</CardMedia>
			</Card>
			<br />

			<Card style={ { width: 360 } } size="sm">
				<CardHeader>
					<div>Content</div>
				</CardHeader>
				<CardMedia>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</CardMedia>
				<CardFooter>
					<div>Content</div>
				</CardFooter>
			</Card>
			<br />
			<Card style={ { width: 360 } } size="sm">
				<CardMedia>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</CardMedia>
			</Card>

			<br />
			<br />
			<br />
			<br />
			<Card style={ { width: 360 } }>
				<CardMedia>
					<iframe
						width="560"
						height="315"
						src="https://www.youtube.com/embed/zGP6zk7jcrQ"
						frameBorder="0"
						allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						title="CORGI!!!!!!!"
					></iframe>
				</CardMedia>
			</Card>
		</div>
	);
};

export const divider = () => {
	const props = {
		size: select( 'size', {
			lg: 'lg',
			md: 'md',
			sm: 'sm',
			xs: 'xs',
		} ),
		variant: select( 'variant', {
			default: 'default',
			borderless: 'borderless',
			raised: 'raised',
		} ),
	};

	return (
		<div>
			<Card style={ { width: 360 } } { ...props }>
				<CardBody>
					<div>Content</div>
				</CardBody>
				<CardDivider />
				<CardBody>
					<div>Content</div>
				</CardBody>
			</Card>
		</div>
	);
};

export const playground = () => {
	const body = text( 'body', 'Code is Poetry' );
	const header = text( 'header', 'Header' );
	const footer = text( 'footer', 'Footer' );

	const isHeaderShady = boolean( 'isHeaderShady', false );
	const isFooterShady = boolean( 'isFooterShade', false );

	const props = {
		size: select( 'size', {
			lg: 'lg',
			md: 'md',
			sm: 'sm',
			xs: 'xs',
		} ),
		variant: select( 'variant', {
			default: 'default',
			borderless: 'borderless',
			raised: 'raised',
		} ),
	};

	return (
		<>
			<Card { ...props }>
				{ header && (
					<CardHeader isShady={ isHeaderShady }>{ header }</CardHeader>
				) }
				{ body && <CardBody>{ body }</CardBody> }
				{ footer && (
					<CardFooter isShady={ isFooterShady }>{ footer }</CardFooter>
				) }
			</Card>
		</>
	);
};

export const blockDirectoryCard = () => {
	return (
		<Card>
			<CardBody size="sm">Stuff</CardBody>
			<CardDivider />
			<CardBody isShady>Stuff</CardBody>
		</Card>
	);
};
