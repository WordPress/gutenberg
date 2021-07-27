/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function TemplateActions( { template } ) {
	const { has_theme_file: hasThemeFile, author } = template;
	const addedBy = useSelect(
		( select ) => {
			if ( hasThemeFile ) {
				const theme = select( coreStore ).getCurrentTheme()?.name
					?.rendered;
				return theme
					? sprintf(
							/* translators: %s: theme name. */
							__( '%s theme' ),
							theme
					  )
					: '';
			}
			return select( coreStore ).getUser( author )?.name;
		},
		[ hasThemeFile, author ]
	);
	return (
		<DropdownMenu icon={ moreVertical } label={ __( 'Template actions' ) }>
			{ ( { onClose } ) => (
				<>
					{ addedBy && (
						<MenuGroup label={ __( 'Added by' ) }>
							<p className="edit-site-mosaic-view__added-by-text">
								{ addedBy }
							</p>
						</MenuGroup>
					) }
					<MenuGroup>
						{ hasThemeFile ? (
							<MenuItem>
								{ __( 'Clear customizations' ) }
							</MenuItem>
						) : (
							<MenuItem isDestructive>
								{ __( 'Delete' ) }
							</MenuItem>
						) }
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
