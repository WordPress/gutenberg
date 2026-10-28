import { useSelect } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { moreVertical } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Button,
	// eslint-disable-next-line @wordpress/use-recommended-components
	IconButton,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
} from '@wordpress/ui';
import type { SitePreviewContext } from '@wordpress/routes-site-preview';

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

/**
 * Edits what the site shows: its content when it has some, otherwise the
 * template that renders it. When it has both, the template is offered in a
 * menu beside the button, along with viewing the page in a new tab.
 *
 * @param props           Component props.
 * @param props.context   What the site shows.
 * @param props.publicUrl The public URL of what the site shows.
 * @return The actions.
 */
export default function EditActions( {
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

	return (
		<>
			<Button
				size="compact"
				disabled={ ! editLink }
				focusableWhenDisabled
				onClick={ () => {
					if ( editLink ) {
						navigate( { to: editLink } );
					}
				} }
			>
				{ getEditLabel( contentEditLink ? context : null ) }
			</Button>
			<Menu.Root>
				<Menu.Trigger
					render={
						<IconButton
							variant="minimal"
							tone="neutral"
							size="compact"
							icon={ moreVertical }
							label={ __( 'More actions' ) }
						/>
					}
				/>
				<Menu.Popup>
					<Menu.Item
						onClick={ () =>
							window.open( publicUrl, '_blank', 'noopener' )
						}
					>
						<Menu.ItemLabel>{ __( 'View' ) }</Menu.ItemLabel>
					</Menu.Item>
					{ contentEditLink && templateEditLink ? (
						<Menu.Item
							onClick={ () =>
								navigate( { to: templateEditLink } )
							}
						>
							<Menu.ItemLabel>
								{ __( 'Edit template' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					) : null }
				</Menu.Popup>
			</Menu.Root>
		</>
	);
}
