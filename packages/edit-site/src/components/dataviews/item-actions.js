/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';

export default function ItemActions( { item, actions } ) {
	const { primaryActions, secondaryActions } = useMemo( () => {
		return actions.reduce(
			( accumulator, action ) => {
				// If an action is eligible for all items, doesn't need
				// to provide the `isEligible` function.
				if ( action.isEligible && ! action.isEligible( item ) ) {
					return accumulator;
				}
				if ( action.isPrimary && !! action.icon ) {
					accumulator.primaryActions.push( action );
				} else {
					accumulator.secondaryActions.push( action );
				}
				return accumulator;
			},
			{ primaryActions: [], secondaryActions: [] }
		);
	}, [ actions, item ] );
	if ( ! primaryActions.length && ! secondaryActions.length ) {
		return null;
	}
	return (
		<HStack justify="flex-end">
			{ !! primaryActions.length &&
				primaryActions.map( ( action ) => (
					<Button
						label={ action.label }
						key={ action.id }
						icon={ action.icon }
						onClick={ () => action.perform( item ) }
						isDestructive={ action.isDestructive }
						size="compact"
					/>
				) ) }
			{ !! secondaryActions.length && (
				<DropdownMenu icon={ moreVertical } label={ __( 'Actions' ) }>
					{ () => (
						<MenuGroup>
							{ secondaryActions.map( ( action ) => (
								<MenuItem
									key={ action.id }
									onClick={ () => action.perform( item ) }
									isDestructive={ action.isDestructive }
								>
									{ action.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
				</DropdownMenu>
			) }
		</HStack>
	);
}
