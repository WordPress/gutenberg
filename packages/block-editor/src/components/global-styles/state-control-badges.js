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
	viewportStates = [],
	customStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	customStateValue = 'default',
	pseudoStateValue = 'default',
	className = 'block-editor-global-styles-state-control__badges',
} ) {
	const activeStates = [
		{
			states: viewportStates,
			value: viewportValue,
			keyPrefix: 'viewport',
		},
		{
			states: customStates,
			value: customStateValue,
			keyPrefix: 'custom',
		},
		{
			states: pseudoStates,
			value: pseudoStateValue,
			keyPrefix: 'pseudo',
		},
	].flatMap( ( { states, value, keyPrefix } ) => {
		const selected = states.find( ( state ) => state.value === value );
		return selected
			? [
					{
						key: `${ keyPrefix }-${ selected.value }`,
						label: selected.label,
					},
			  ]
			: [];
	} );

	return (
		<Stack
			className={ className }
			direction="row"
			justify="flex-start"
			gap="xs"
			wrap="wrap"
		>
			{ activeStates.map( ( state ) => (
				<WCBadge key={ state.key } intent="info">
					{ state.label }
				</WCBadge>
			) ) }
		</Stack>
	);
}
