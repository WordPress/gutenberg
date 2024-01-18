/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { plugins as pluginsIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { BlockControls } from '../components';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title' ],
	'core/button': [ 'url', 'text' ],
};

function BlockBindingsUI( { name: blockName, clientId } ) {
	const { attributes, sources } = useSelect( ( select ) => {
		return {
			attributes:
				select( blockEditorStore ).getBlockAttributes( clientId ),
			sources: unlock(
				select( blockEditorStore )
			).getAllBlockBindingsSources(),
		};
	}, [] );

	return (
		<>
			<BlockControls group="other">
				<DropdownMenu
					onOpenChange={ function noRefCheck() {} }
					trigger={
						<Button __next40pxDefaultSize icon={ pluginsIcon } />
					}
				>
					{ /* Iterate over block attributes */ }
					{ BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ].map(
						( attribute ) => {
							return (
								<DropdownMenu
									trigger={
										<DropdownMenuItem>
											<DropdownMenuItemLabel>
												{ attribute }
											</DropdownMenuItemLabel>
										</DropdownMenuItem>
									}
									key={ attribute }
								>
									{ /* Iterate over sources */ }
									{ Object.entries( sources ).map(
										( [ sourceName, source ] ) => {
											return (
												<DropdownMenu
													trigger={
														<DropdownMenuItem>
															<DropdownMenuItemLabel
																className={
																	attributes
																		.metadata
																		?.bindings?.[
																		attribute
																	]?.source
																		?.name ===
																		sourceName &&
																	'is-source-bound'
																}
															>
																{ source.label }
															</DropdownMenuItemLabel>
														</DropdownMenuItem>
													}
													key={ sourceName }
												>
													{ source.component() }
												</DropdownMenu>
											);
										}
									) }
								</DropdownMenu>
							);
						}
					) }
				</DropdownMenu>
			</BlockControls>
		</>
	);
}

export default {
	edit: BlockBindingsUI,
	hasSupport() {
		return true;
	},
};

if ( window.__experimentalBlockBindings ) {
	addFilter(
		'blocks.registerBlockType',
		'core/block-bindings-ui',
		( settings, name ) => {
			if ( ! ( name in BLOCK_BINDINGS_ALLOWED_BLOCKS ) ) {
				return settings;
			}
			const contextItems = [ 'postId', 'postType', 'queryId' ];
			const usesContextArray = settings.usesContext;
			const oldUsesContextArray = new Set( usesContextArray );
			contextItems.forEach( ( item ) => {
				if ( ! oldUsesContextArray.has( item ) ) {
					usesContextArray.push( item );
				}
			} );
			settings.usesContext = usesContextArray;
			return settings;
		}
	);
}
