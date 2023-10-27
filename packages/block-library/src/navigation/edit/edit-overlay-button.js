/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	DropdownMenu,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as coreStore } from '@wordpress/core-data';
import { parse, serialize } from '@wordpress/blocks';
import { moreVertical } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import useGoToOverlayEditor from './use-go-to-overlay-editor';
import useOverlay from './use-overlay';

const { useHistory } = unlock( routerPrivateApis );

export default function EditOverlayButton( {
	navRef,
	attributes,
	setAttributes,
} ) {
	const currentOverlayId = attributes?.overlayId;

	// Get any custom overlay attached to this block,
	// falling back to the one provided by the Theme.
	const overlay = useOverlay( currentOverlayId );

	const { coreOverlay, allOverlays } = useSelect( ( select ) => {
		return {
			// Get the default template part that core provides.
			coreOverlay: select( coreStore ).getEntityRecord(
				'postType',
				'wp_template_part',
				`core//navigation-overlay`
			),
			// Get all the overlays.
			allOverlays: select( coreStore ).getEntityRecords(
				'postType',
				'wp_template_part',
				{
					area: 'navigation-overlay',
				}
			),
		};
	}, [] );

	const { saveEntityRecord } = useDispatch( coreStore );

	const history = useHistory();

	const goToOverlayEditor = useGoToOverlayEditor();

	async function handleEditOverlay( event ) {
		event.preventDefault();

		// There may already be an overlay with the slug `navigation-overlay`.
		// This might be a user created one, or one provided by the theme.
		// If so, then go directly to the editor for that overlay template part.
		if ( overlay ) {
			goToOverlayEditor( overlay.id, navRef );
			return;
		}

		// If there is not overlay then create one using the base template part
		// provided by Core.
		// TODO: catch and handle errors.
		const overlayBlocks = buildOverlayBlocks( coreOverlay.content.raw );

		// The new overlay should use the current Theme's slug.
		const newOverlay = await createOverlay( overlayBlocks );

		goToOverlayEditor( newOverlay?.id, navRef );
	}

	async function handleCreateNewOverlay() {
		const overlayBlocks = buildOverlayBlocks( overlay.content.raw );

		const newOverlay = await createOverlay( overlayBlocks );

		setAttributes( {
			overlayId: newOverlay?.id,
		} );

		goToOverlayEditor( newOverlay?.id, navRef );
	}

	function buildOverlayBlocks( content ) {
		const parsedBlocks = parse( content );
		return parsedBlocks;
	}

	async function createOverlay( overlayBlocks ) {
		return await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: `navigation-overlay`, // `theme//` prefix is appended automatically.
				title: `Navigation Overlay`,
				content: serialize( overlayBlocks ),
				area: 'navigation-overlay',
			},
			{ throwOnError: true }
		);
	}

	// Map the overlay records to format
	const overlayChoices = allOverlays?.map( ( overlayRecord ) => {
		return {
			label: overlayRecord.title.rendered, // decodeEntities required
			value: overlayRecord.id,
		};
	} );

	if ( ! history || ( ! coreOverlay && ! overlay ) ) {
		return null;
	}

	return (
		<>
			<Button
				aria-label={ __( 'Edit Overlay' ) }
				variant="link"
				className="wp-block-navigation__edit-overlay-button"
				onClick={ handleEditOverlay }
			>
				{ __( 'Edit' ) }
			</Button>
			<DropdownMenu
				label={ __( 'Select Overlay' ) }
				icon={ moreVertical }
				toggleProps={ { isSmall: true } }
			>
				{ () => (
					<>
						<MenuGroup label={ __( 'Overlays' ) }>
							<MenuItemsChoice
								value={ overlay?.id }
								onSelect={ ( newOverlayId ) => {
									setAttributes( {
										overlayId: newOverlayId,
									} );
								} }
								choices={ overlayChoices }
								disabled={ overlayChoices?.length === 0 }
							/>
						</MenuGroup>

						<MenuGroup label={ __( 'Tools' ) }>
							<MenuItem
								onClick={ ( event ) => {
									event.preventDefault();
									handleCreateNewOverlay();
								} }
							>
								{ __( 'Create new overlay' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</>
	);
}
