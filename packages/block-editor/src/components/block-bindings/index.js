/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useBlockBindingsUtils } from '../../utils/block-bindings';

const { Menu } = unlock( componentsPrivateApis );

function BlockBindingsDropdown( {
	attribute,
	binding,
	data,
	source,
	sourceKey,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const { isMobile } = useViewportMatch( 'medium', '<' );

	const noItemsAvailable = ! data || data.length === 0;

	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			{ noItemsAvailable ? (
				<Menu.Item disabled>{ source.label }</Menu.Item>
			) : (
				<Menu.SubmenuTriggerItem>
					<Menu.ItemLabel>{ source.label }</Menu.ItemLabel>
				</Menu.SubmenuTriggerItem>
			) }

			{ ! noItemsAvailable && (
				<Menu.Popover gutter={ 8 }>
					<Menu.Group>
						{ data.map( ( item ) => {
							const itemBindings = {
								source: sourceKey,
								args: item?.args || {
									key: item.key,
								},
							};

							return (
								<Menu.CheckboxItem
									key={
										sourceKey +
											JSON.stringify( item.args ) ||
										item.key
									}
									onChange={ () => {
										const isCurrentlySelected =
											fastDeepEqual(
												binding?.args,
												item.args
											) ??
											// Deprecate key dependency in 7.0.
											item.key === binding?.args?.key;

										if ( isCurrentlySelected ) {
											// Unset if the same item is selected again.
											updateBlockBindings( {
												[ attribute ]: undefined,
											} );
										} else {
											updateBlockBindings( {
												[ attribute ]: itemBindings,
											} );
										}
									} }
									name={ attribute + '-binding' }
									value={ item.value }
									checked={
										fastDeepEqual(
											binding?.args,
											item.args
										) ??
										// Deprecate key dependency in 7.0.
										item.key === binding?.args?.key
									}
								>
									<Menu.ItemLabel>
										{ item?.label }
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										{ item.value }
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
							);
						} ) }
					</Menu.Group>
				</Menu.Popover>
			) }
		</Menu>
	);
}

export { BlockBindingsDropdown };
