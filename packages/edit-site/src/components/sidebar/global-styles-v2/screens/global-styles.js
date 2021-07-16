/**
 * WordPress dependencies
 */
import {
	CardBody,
	ItemGroup,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { NavLink, Screen, StylePreview } from '../components';

export const GlobalStylesScreen = () => {
	return (
		<Screen>
			<StylePreview />
			<CardBody>
				<ItemGroup>
					<NavLink to="/colors">
						<Text weight={ 600 }>Colors</Text>
					</NavLink>
					<NavLink to="/typography">
						<Text weight={ 600 }>Typography</Text>
					</NavLink>
				</ItemGroup>
			</CardBody>
		</Screen>
	);
};
