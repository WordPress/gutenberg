/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

export default function StateControlBadges( {
	states,
	className = 'block-editor-global-styles-state-control__badges',
} ) {
	return (
		<Stack
			className={ className }
			direction="row"
			justify="flex-start"
			gap="xs"
			wrap="wrap"
		>
			{ states.map( ( state ) => (
				<WCBadge key={ state.key } intent="info">
					{ state.label }
				</WCBadge>
			) ) }
		</Stack>
	);
}
