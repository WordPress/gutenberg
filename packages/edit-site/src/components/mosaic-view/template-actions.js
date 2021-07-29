/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch, select as storeSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function TemplateActions( {
	hasThemeFile,
	templateAuthor,
	templateId,
	templateTitle,
} ) {
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
			return select( coreStore ).getUser( templateAuthor )?.name;
		},
		[ hasThemeFile, templateAuthor ]
	);
	const { revertTemplate } = useDispatch( editSiteStore );
	const { deleteEntityRecord } = useDispatch( coreStore );
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
							<MenuItem
								onClick={ () => {
									revertTemplate(
										storeSelect(
											coreStore
										).getEntityRecord(
											'postType',
											'wp_template',
											templateId
										)
									);
									onClose();
								} }
							>
								{ __( 'Clear customizations' ) }
							</MenuItem>
						) : (
							<MenuItem
								isDestructive
								onClick={ () => {
									if (
										// eslint-disable-next-line no-alert
										window.confirm(
											sprintf(
												/* translators: %s: template name */
												__(
													'Are you sure you want to delete the %s template? It may be in use by multiple pages and/or posts.'
												),
												templateTitle
											)
										)
									) {
										deleteEntityRecord(
											'postType',
											'wp_template',
											templateId
										);
										onClose();
									}
								} }
							>
								{ __( 'Delete' ) }
							</MenuItem>
						) }
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
