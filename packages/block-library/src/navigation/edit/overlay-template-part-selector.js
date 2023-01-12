/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	DropdownMenu,
	VisuallyHidden,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { Icon, chevronUp, chevronDown } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useNavigationEntities from '../use-navigation-entities';

function OverlayTemplatePartSelector( {
	attributes,
	setAttributes,
	toggleProps = {},
} ) {
	const { overlayTemplatePart } = attributes;
	const [ isPressed, setIsPressed ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );
	const [ enableOptions, setEnableOptions ] = useState( false );
	const [ isCreatingTemplatePart, setIsCreatingTemplatePart ] =
		useState( false );
	const { templateParts } = useNavigationEntities();
	const hasTemplateParts = !! templateParts?.length;

	/**
	 * To do:
	 * Must safeguard from errors and potential permission issues.
	 * Make a better template for the default content in the new template part.
	 */
	async function createOverlayTemplatePart() {
		const newTemplatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: 'navigation-overlay',
				title: 'Navigation Overlay',
				content:
					'<!-- wp:group {"align":"full","layout":{"type":"constrained"}} --><div class="wp-block-group alignfull"><!-- wp:navigation {"overlayMenu":"never"} /--></div><!-- /wp:group -->',
			}
		);
		setAttributes( { overlayTemplatePart: newTemplatePart?.id } );
		/*
		 * Todo: After a new part has been created, we need to either:
		 * 1. Redirect to the new template part
		 * 2. Update the list of template parts in the dropdown without refreshing the full page.
		 *
		 * Until then, unlock the dropdown:
		 */
		setIsCreatingTemplatePart( false );
		setEnableOptions( true );
	}

	// Filter out template parts that are not navigation overlays.
	let filteredTemplateParts = '';
	if ( hasTemplateParts ) {
		filteredTemplateParts = templateParts.filter(
			( post ) => post.title.rendered === 'Navigation Overlay'
		);
	}

	// Create a list of template parts for the dropdown.
	const templatePartChoices = useMemo( () => {
		if ( ! filteredTemplateParts ) {
			return;
		}
		return (
			filteredTemplateParts?.map( ( { id, slug } ) => {
				/**
				 * This replacement is very silly but we need a unique identifier:
				 * the title is not unique and the slug is not pretty.
				 * Make the slug prettier:
				 */
				const label = slug
					.replaceAll( '-', ' ' )
					.replace( 'n', 'N' )
					.replaceAll( 'o', 'O' )
					.replace( 'O', 'o' );
				if ( id === overlayTemplatePart && ! isCreatingTemplatePart ) {
					setEnableOptions( true );
				}
				return {
					value: id,
					label,
				};
			} ) || []
		);
	}, [] );

	toggleProps = {
		...toggleProps,
		className: 'wp-block-navigation__navigation-selector-button',
		children: (
			<>
				<VisuallyHidden as="span">
					{ __( 'Select Overlay' ) }
				</VisuallyHidden>
				<Icon
					icon={ isPressed ? chevronUp : chevronDown }
					className="wp-block-navigation__navigation-selector-button__icon"
				/>
			</>
		),
		isBusy: ! enableOptions,
		disabled: ! enableOptions,
		__experimentalIsFocusable: true,
		onClick: () => {
			setIsPressed( ! isPressed );
		},
	};

	return (
		<>
			<DropdownMenu
				className={ 'wp-block-navigation__navigation-selector' }
				text={ __( 'Navigation Overlay' ) }
				icon={ false }
				toggleProps={ toggleProps }
			>
				{ ( { onClose } ) => (
					<>
						{ templatePartChoices && (
							<MenuGroup label={ __( 'Overlays' ) }>
								<MenuItemsChoice
									value={ overlayTemplatePart }
									choices={ templatePartChoices }
									onSelect={ ( value ) => {
										setAttributes( {
											overlayTemplatePart: value,
										} );
									} }
								/>
							</MenuGroup>
						) }
						<MenuGroup label={ __( 'Tools' ) }>
							<MenuItem
								onClick={ () => {
									onClose();
									createOverlayTemplatePart();
									setIsCreatingTemplatePart( true );
									setEnableOptions( false );
								} }
							>
								{ __( 'Create new Overlay' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
			{ overlayTemplatePart && (
				<Button
					isBusy={ ! enableOptions }
					disabled={ ! enableOptions }
					variant="link"
					href={ addQueryArgs( 'site-editor.php', {
						postType: 'wp_template_part',
						postId: overlayTemplatePart,
						canvas: 'edit',
					} ) }
				>
					{ __( 'Edit Overlay' ) }
				</Button>
			) }
		</>
	);
}

export default OverlayTemplatePartSelector;
