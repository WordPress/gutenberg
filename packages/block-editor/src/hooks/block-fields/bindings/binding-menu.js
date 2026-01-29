/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import BlockBindingsSourceFieldsList from '../../../components/block-bindings/source-fields-list';
import useBlockBindingsUtils from '../../../components/block-bindings/use-block-bindings-utils';
import { getCompatibleFields } from './get-compatible-fields';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Menu content for managing bindings.
 *
 * @param {Object} props              Component props.
 * @param {string} props.fieldId      The field/attribute identifier.
 * @param {string} props.blockName    The block type name.
 * @param {string} props.clientId     The block client ID.
 * @param {Object} props.blockContext The block context.
 * @param {Object} props.binding      Current binding (if any).
 * @param {string} props.placement    Popover placement.
 * @return {Element} The binding menu component.
 */
export default function BindingMenu( {
	fieldId,
	blockName,
	clientId,
	blockContext,
	binding,
	placement = 'left-start',
} ) {
	const compatibleFields = useSelect(
		( select ) =>
			getCompatibleFields( fieldId, blockName, blockContext, select ),
		[ fieldId, blockName, blockContext ]
	);

	const { updateBlockBindings } = useBlockBindingsUtils( clientId );

	const hasCompatibleFields = Object.keys( compatibleFields ).length > 0;
	const isBound = !! binding;

	const handleDisconnect = () => {
		updateBlockBindings( {
			[ fieldId ]: undefined,
		} );
	};

	return (
		<Menu.Popover placement={ placement } gutter={ 8 }>
			<Menu>
				<Menu.Group>
					{ ! hasCompatibleFields && ! isBound && (
						<Menu.Item disabled>
							<Menu.ItemLabel>
								{ __( 'No sources available' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) }

					{ hasCompatibleFields &&
						Object.entries( compatibleFields ).map(
							( [ sourceKey, fields ] ) => (
								<BlockBindingsSourceFieldsList
									key={ sourceKey }
									sourceKey={ sourceKey }
									fields={ fields }
									attribute={ fieldId }
									args={ binding?.args }
								/>
							)
						) }
				</Menu.Group>

				{ isBound && (
					<>
						<Menu.Separator />
						<Menu.Group>
							<Menu.Item onClick={ handleDisconnect }>
								<Menu.ItemLabel>
									{ __( 'Disconnect' ) }
								</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Group>
					</>
				) }
			</Menu>
		</Menu.Popover>
	);
}
