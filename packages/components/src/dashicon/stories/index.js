/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { number, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Card } from '../../card';
import { CardBody } from '../../card/body';
import Dashicon from '../';
import { ICONS } from '../icons';

export default { title: 'Components|Dashicon', component: Dashicon };

export const _default = () => {
	const icon = text( 'Icon', 'wordpress' );
	const color = text( 'Color', '#0079AA' );
	const size = number( 'Size', 20 );

	return <Dashicon icon={ icon } color={ color } size={ size } />;
};

export const dashIcons = () => {
	const icons = Object.keys( ICONS );

	return (
		<Container>
			<Grid>
				{ icons.map( ( icon ) => (
					<GridItem key={ icon }>
						<Card size="small">
							<CardBody>
								<IconWrapper>
									<Dashicon icon={ icon } size={ 20 } />
								</IconWrapper>
								<Label>{ icon }</Label>
							</CardBody>
						</Card>
					</GridItem>
				) ) }
			</Grid>
		</Container>
	);
};

const Container = styled.div`
	padding: 0 10px;
`;

const Grid = styled.div`
	display: flex;
	flex-wrap: wrap;
	margin: 0 -10px;
`;

const GridItem = styled.div`
	padding: 10px;
	width: 120px;
`;

const IconWrapper = styled.div`
	margin: 0 auto 8px;
	display: flex;
	justify-content: center;
`;

const Label = styled.div`
	font-size: 10px;
	text-align: center;
	min-height: 32px;
`;
