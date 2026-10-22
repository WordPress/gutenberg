import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { moreVertical } from '@wordpress/icons';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import {
	SitePreview,
	useSiteUrl,
	type SitePreviewContext,
} from '@wordpress/routes-site-preview';

function getEditLabel( context: SitePreviewContext | null ): string {
	if ( context?.postType === 'post' ) {
		return __( 'Edit post' );
	}

	if ( context?.postType === 'page' ) {
		return __( 'Edit page' );
	}

	if ( context?.postType && context.postTypeLabel ) {
		return sprintf(
			/* translators: %s: singular post type label, e.g. "Product". */
			__( 'Edit %s' ),
			context.postTypeLabel
		);
	}

	return __( 'Edit template' );
}

function PreviewActions( {
	context,
	publicUrl,
}: {
	context: SitePreviewContext | null;
	publicUrl: string;
} ) {
	const navigate = useNavigate();
	const { contentEditLink, templateEditLink } = useSelect(
		( select ) => {
			const { getEntityLink } = select( bootStore );
			return {
				contentEditLink:
					context?.postType && context.postId
						? getEntityLink( context.postType, context.postId )
						: undefined,
				templateEditLink: context?.templateId
					? getEntityLink( 'wp_template', context.templateId )
					: undefined,
			};
		},
		[ context ]
	);

	const editLink = contentEditLink ?? templateEditLink;
	const openEditor = ( to: string ) => navigate( { to } );

	return (
		<>
			<Button
				variant="primary"
				size="compact"
				accessibleWhenDisabled
				disabled={ ! editLink }
				onClick={ () => {
					if ( editLink ) {
						openEditor( editLink );
					}
				} }
			>
				{ getEditLabel( contentEditLink ? context : null ) }
			</Button>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'More actions' ) }
				toggleProps={ { size: 'compact' } }
				popoverProps={ { placement: 'bottom-end' } }
			>
				{ ( { onClose } ) => (
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								onClose();
								window.open( publicUrl, '_blank', 'noopener' );
							} }
						>
							{ __( 'View' ) }
						</MenuItem>
						{ contentEditLink && templateEditLink ? (
							<MenuItem
								onClick={ () => {
									onClose();
									openEditor( templateEditLink );
								} }
							>
								{ __( 'Edit template' ) }
							</MenuItem>
						) : null }
					</MenuGroup>
				) }
			</DropdownMenu>
		</>
	);
}

function HomePreview() {
	const siteUrl = useSiteUrl();
	const navigate = useNavigate();
	// The previewed location is kept in the `preview` search param.
	const { preview } = useSearch( { strict: false } ) as {
		preview?: unknown;
	};

	const onPathChange = useCallback(
		( path: string | undefined ) =>
			navigate( {
				to: '/',
				search: path ? { preview: path } : {},
				replace: true,
			} ),
		[ navigate ]
	);

	if ( ! siteUrl ) {
		return null;
	}

	return (
		<SitePreview
			siteUrl={ siteUrl }
			path={ preview }
			onPathChange={ onPathChange }
			renderActions={ ( props ) => <PreviewActions { ...props } /> }
		/>
	);
}

export const canvas = HomePreview;
