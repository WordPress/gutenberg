/**
 * External dependencies
 */

/* eslint-disable import/no-extraneous-dependencies */
import { text, boolean, select } from '@storybook/addon-knobs';
/* eslint-enable import/no-extraneous-dependencies */

/**
 * Internal dependencies
 */
import Card from '../';

export default { title: 'Card', component: Card };

export const _default = () => (
	<Card>
		<Card.Body>Code is Poetry</Card.Body>
	</Card>
);

export const media = () => {
	return (
		<div>
			<Card style={ { width: 360 } } size="sm">
				<Card.Media>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</Card.Media>
				<Card.Body>
					<div>Content</div>
				</Card.Body>
			</Card>
			<br />

			<Card style={ { width: 360 } } size="sm">
				<Card.Header>
					<div>Content</div>
				</Card.Header>
				<Card.Media>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</Card.Media>
			</Card>
			<br />

			<Card style={ { width: 360 } } size="sm">
				<Card.Header>
					<div>Content</div>
				</Card.Header>
				<Card.Media>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</Card.Media>
				<Card.Footer>
					<div>Content</div>
				</Card.Footer>
			</Card>
			<br />
			<Card style={ { width: 360 } } size="sm">
				<Card.Media>
					<img
						src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
						alt="SMELLING MARSHMELLOW ICECREAM CONE"
					/>
				</Card.Media>
			</Card>

			<br />
			<br />
			<br />
			<br />
			<Card style={ { width: 360 } }>
				<Card.Media>
					<iframe
						width="560"
						height="315"
						src="https://www.youtube.com/embed/zGP6zk7jcrQ"
						frameBorder="0"
						allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						title="CORGI!!!!!!!"
					></iframe>
				</Card.Media>
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
				<Card.Body>
					<div>Content</div>
				</Card.Body>
				<Card.Divider />
				<Card.Body>
					<div>Content</div>
				</Card.Body>
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
				{ header && <Card.Header isShady={ isHeaderShady }>{ header }</Card.Header> }
				{ body && <Card.Body>{ body }</Card.Body> }
				{ footer && <Card.Footer isShady={ isFooterShady }>{ footer }</Card.Footer> }
			</Card>
		</>
	);
};

export const blockDirectoryCard = () => {
	return (
		<Card size="sm">
			<Card.Body>Stuff</Card.Body>
			<Card.Divider />
			<Card.Body isShady>Stuff</Card.Body>
		</Card>
	);
};
