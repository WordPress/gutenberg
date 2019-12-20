/**
 * External dependencies
 */
/* eslint-disable import/no-extraneous-dependencies */
import { boolean, number, select, text } from '@storybook/addon-knobs';
/* eslint-enable import/no-extraneous-dependencies */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Card from '../index';
import CardBody from '../body';
import CardFooter from '../footer';
import CardHeader from '../header';
import CardMedia from '../media';
import { getCardStoryProps } from './_utils';

export default { title: 'Components|Card/Media', component: CardMedia };

const DummyImage = () => (
	<img
		src="https://images.unsplash.com/photo-1570776765652-4ce2a88cc1f9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
		alt="SMELLING MARSHMELLOW ICECREAM CONE"
	/>
);

export const _default = () => {
	const mediaOnTop = boolean( 'Example: On Top', true );
	const props = getCardStoryProps();

	const showTopContent = ! mediaOnTop;
	const showBottomContent = ! showTopContent;
	const content = text( 'Body: children', 'Content' );

	return (
		<Card { ...props }>
			{ showTopContent && <CardBody>{ content }</CardBody> }
			<CardMedia>
				<DummyImage />
			</CardMedia>
			{ showBottomContent && <CardBody>{ content }</CardBody> }
		</Card>
	);
};

export const onTop = () => {
	const props = getCardStoryProps();

	return (
		<Card { ...props }>
			<CardMedia>
				<DummyImage />
			</CardMedia>
			<CardBody>
				<div>Content</div>
			</CardBody>
		</Card>
	);
};

export const onBottom = () => {
	const props = getCardStoryProps();

	return (
		<Card { ...props }>
			<CardBody>Content</CardBody>
			<CardMedia>
				<DummyImage />
			</CardMedia>
		</Card>
	);
};

export const headerAndFooter = () => {
	const props = getCardStoryProps();

	return (
		<Card { ...props }>
			<CardHeader>Header Content</CardHeader>
			<CardMedia>
				<DummyImage />
			</CardMedia>
			<CardFooter isShady>Caption</CardFooter>
		</Card>
	);
};

export const iframeEmbed = () => {
	const props = getCardStoryProps();

	return (
		<Card { ...props }>
			<CardHeader>Header Content</CardHeader>
			<CardMedia>
				<iframe
					width="560"
					height="315"
					src="https://www.youtube.com/embed/zGP6zk7jcrQ"
					frameBorder="0"
					allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					title="Corgi"
				></iframe>
			</CardMedia>
		</Card>
	);
};

/**
 * Referring to other styled components:
 * https://www.styled-components.com/docs/advanced#referring-to-other-components
 * https://www.styled-components.com/docs/advanced#caveat
 */
const StyledCardMedia = styled( CardMedia )( '' );
const StyledCardBody = styled( CardBody )( '' );

const HorizontallyAlignedCard = styled( Card )`
	display: flex;

	&.is-right {
		flex-direction: row-reverse;
	}

	${ StyledCardBody } {
		flex: 1;
	}

	${ StyledCardMedia } {
		&.is-left {
			border-radius: 3px 0 0 3px;
		}
		&.is-right {
			border-radius: 0 3px 3px 0;
		}
	}
`;

export const horizontallyAligned = () => {
	const align = select(
		'Example: Align',
		{
			left: 'left',
			right: 'right',
		},
		'left'
	);
	const maxWidth = number( 'Example: Media Width', 200 );
	const content = text( 'Body: children', 'Content' );
	const classes = `is-${ align }`;

	return (
		<>
			<p>
				Note: This story demonstrates how this UI may be created. It
				requires extra styling.
			</p>
			<HorizontallyAlignedCard className={ classes }>
				<StyledCardMedia className={ classes } style={ { maxWidth } }>
					<DummyImage />
				</StyledCardMedia>
				<StyledCardBody>{ content }</StyledCardBody>
			</HorizontallyAlignedCard>
		</>
	);
};
