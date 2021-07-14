/**
 * Internal dependencies
 */
import { BADGE_COLORS } from '../colors';
import { Badge } from '..';

export default {
	title: 'Components (Experimental)/Badge',
	component: Badge,
};

export const _default = () => {
	const badges = Object.keys( BADGE_COLORS );

	return (
		<>
			<>
				{ badges.map( ( badge ) => (
					<Badge color={ badge } isBold key={ badge }>
						{ badge }
					</Badge>
				) ) }
			</>
			<>
				{ badges.map( ( badge ) => (
					<Badge color={ badge } key={ badge }>
						{ badge }
					</Badge>
				) ) }
			</>
		</>
	);
};
