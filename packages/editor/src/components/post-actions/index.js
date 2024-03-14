/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as componentsPrivateApis,
	Button,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	WithDropDownMenuSeparators,
	ActionsDropdownMenuGroup,
} from './utility-components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuV2: DropdownMenu } = unlock( componentsPrivateApis );

export default function PostActions( { actions, postType, postId } ) {
	const item = useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			return getEditedEntityRecord( 'postType', postType, postId );
		},
		[ postType, postId ]
	);

	const { primaryActions, secondaryActions } = useMemo( () => {
		return actions.reduce(
			( accumulator, action ) => {
				if ( action.isEligible && ! action.isEligible( item ) ) {
					return accumulator;
				}
				if ( action.isPrimary ) {
					accumulator.primaryActions.push( action );
				} else {
					accumulator.secondaryActions.push( action );
				}
				return accumulator;
			},
			{ primaryActions: [], secondaryActions: [] }
		);
	}, [ actions, item ] );
	return (
		<DropdownMenu
			trigger={
				<Button
					size="compact"
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					disabled={
						! primaryActions.length && ! secondaryActions.length
					}
					className="editor-all-actions-button"
				/>
			}
			placement="bottom-end"
		>
			<WithDropDownMenuSeparators>
				{ !! primaryActions.length && (
					<ActionsDropdownMenuGroup
						actions={ primaryActions }
						item={ item }
					/>
				) }
				{ !! secondaryActions.length && (
					<ActionsDropdownMenuGroup
						actions={ secondaryActions }
						item={ item }
					/>
				) }
			</WithDropDownMenuSeparators>
		</DropdownMenu>
	);
}
