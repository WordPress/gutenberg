/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

const { Badge } = unlock( componentsPrivateApis );

export default function BlockVisibilityInfo( { clientId } ) {
	const { isBlockHidden, hasHiddenParent } = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return { isBlockHidden: false, hasHiddenParent: false };
			}
			const { isBlockHidden: _isBlockHidden, getBlockParents } = unlock(
				select( blockEditorStore )
			);

			const blockHidden = _isBlockHidden( clientId );
			const parents = getBlockParents( clientId );
			const parentHidden = parents.some( ( parentId ) =>
				_isBlockHidden( parentId )
			);

			return {
				isBlockHidden: blockHidden,
				hasHiddenParent: parentHidden,
			};
		},
		[ clientId ]
	);

	if ( ! ( isBlockHidden || hasHiddenParent ) ) {
		return null;
	}

	return (
		<Badge className="block-editor-block-visibility-info">
			<HStack spacing={ 2 } justify="start">
				<Icon icon={ unseen } />
				<Text>
					{ isBlockHidden
						? __( 'Block is hidden' )
						: __( 'Parent block is hidden' ) }
				</Text>
			</HStack>
		</Badge>
	);
}
