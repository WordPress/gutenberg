/**
 * External dependencies
 */
import { startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { CardBody, useNavigatorParams, VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Screen, ScreenHeader } from '../components';

const Header = () => {
	const { id } = useNavigatorParams();
	const title = startCase( id );
	return (
		<ScreenHeader
			back="/colors"
			description={ `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
				congue finibus ante vel maximus.` }
			title={ title }
		/>
	);
};

export const ColorsElementScreen = () => {
	return (
		<Screen>
			<CardBody>
				<VStack spacing={ 8 }>
					<Header />
				</VStack>
			</CardBody>
		</Screen>
	);
};
