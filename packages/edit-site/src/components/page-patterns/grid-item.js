/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Tooltip,
	Flex,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useId, memo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Icon,
	header,
	footer,
	symbolFilled as uncategorized,
	symbol,
	moreVertical,
	lockSmall,
} from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import RenameMenuItem from './rename-menu-item';
import DuplicateMenuItem from './duplicate-menu-item';
import { PATTERNS, TEMPLATE_PARTS, USER_PATTERNS, SYNC_TYPES } from './utils';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';

const templatePartIcons = { header, footer, uncategorized };

function GridItem( { categoryId, item, ...props } ) {
	const descriptionId = useId();
	const [ isDeleteDialogOpen, setIsDeleteDialogOpen ] = useState( false );

	const { removeTemplate } = useDispatch( editSiteStore );
	const { __experimentalDeleteReusableBlock } =
		useDispatch( reusableBlocksStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const isUserPattern = item.type === USER_PATTERNS;
	const isNonUserPattern = item.type === PATTERNS;
	const isTemplatePart = item.type === TEMPLATE_PARTS;

	const { onClick } = useLink( {
		postType: item.type,
		postId: isUserPattern ? item.id : item.name,
		categoryId,
		categoryType: item.type,
	} );

	const isEmpty = ! item.blocks?.length;
	const patternClassNames = classnames( 'edit-site-patterns__pattern', {
		'is-placeholder': isEmpty,
	} );
	const previewClassNames = classnames( 'edit-site-patterns__preview', {
		'is-inactive': isNonUserPattern,
	} );

	const deletePattern = async () => {
		try {
			await __experimentalDeleteReusableBlock( item.id );
			createSuccessNotice(
				sprintf(
					// translators: %s: The pattern's title e.g. 'Call to action'.
					__( '"%s" deleted.' ),
					item.title
				),
				{ type: 'snackbar', id: 'edit-site-patterns-success' }
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while deleting the pattern.' );
			createErrorNotice( errorMessage, {
				type: 'snackbar',
				id: 'edit-site-patterns-error',
			} );
		}
	};
	const deleteItem = () =>
		isTemplatePart ? removeTemplate( item ) : deletePattern();

	// Only custom patterns or custom template parts can be renamed or deleted.
	const isCustomPattern =
		isUserPattern || ( isTemplatePart && item.isCustom );
	const hasThemeFile = isTemplatePart && item.templatePart.has_theme_file;
	const ariaDescriptions = [];

	if ( isCustomPattern ) {
		// User patterns don't have descriptions, but can be edited and deleted, so include some help text.
		ariaDescriptions.push(
			__( 'Press Enter to edit, or Delete to delete the pattern.' )
		);
	} else if ( item.description ) {
		ariaDescriptions.push( item.description );
	}

	if ( isNonUserPattern ) {
		ariaDescriptions.push(
			__( 'Theme & plugin patterns cannot be edited.' )
		);
	}

	const itemIcon =
		templatePartIcons[ categoryId ] ||
		( item.syncStatus === SYNC_TYPES.full ? symbol : undefined );

	const confirmButtonText = hasThemeFile ? __( 'Clear' ) : __( 'Delete' );
	const confirmPrompt = hasThemeFile
		? __( 'Are you sure you want to clear these customizations?' )
		: sprintf(
				// translators: %s: The pattern or template part's title e.g. 'Call to action'.
				__( 'Are you sure you want to delete "%s"?' ),
				item.title
		  );

	return (
		<li className={ patternClassNames }>
			<button
				className={ previewClassNames }
				// Even though still incomplete, passing ids helps performance.
				// @see https://reakit.io/docs/composite/#performance.
				id={ `edit-site-patterns-${ item.name }` }
				{ ...props }
				onClick={ item.type !== PATTERNS ? onClick : undefined }
				aria-disabled={ item.type !== PATTERNS ? 'false' : 'true' }
				aria-label={ item.title }
				aria-describedby={
					ariaDescriptions.length
						? ariaDescriptions
								.map(
									( _, index ) =>
										`${ descriptionId }-${ index }`
								)
								.join( ' ' )
						: undefined
				}
			>
				{ isEmpty && __( 'Empty pattern' ) }
				{ ! isEmpty && <BlockPreview blocks={ item.blocks } /> }
			</button>
			{ ariaDescriptions.map( ( ariaDescription, index ) => (
				<div
					key={ index }
					hidden
					id={ `${ descriptionId }-${ index }` }
				>
					{ ariaDescription }
				</div>
			) ) }
			<HStack
				className="edit-site-patterns__footer"
				justify="space-between"
			>
				<HStack
					alignment="center"
					justify="left"
					spacing={ 3 }
					className="edit-site-patterns__pattern-title"
				>
					{ itemIcon && ! isNonUserPattern && (
						<Tooltip
							position="top center"
							text={ __(
								'Editing this pattern will also update anywhere it is used'
							) }
						>
							<span>
								<Icon
									className="edit-site-patterns__pattern-icon"
									icon={ itemIcon }
								/>
							</span>
						</Tooltip>
					) }
					<Flex as="span" gap={ 0 } justify="left">
						{ item.type === PATTERNS ? (
							item.title
						) : (
							<Heading level={ 5 }>
								<Button
									variant="link"
									onClick={ onClick }
									// Required for the grid's roving tab index system.
									// See https://github.com/WordPress/gutenberg/pull/51898#discussion_r1243399243.
									tabIndex="-1"
								>
									{ item.title }
								</Button>
							</Heading>
						) }
						{ item.type === PATTERNS && (
							<Tooltip
								position="top center"
								text={ __( 'This pattern cannot be edited.' ) }
							>
								<span className="edit-site-patterns__pattern-lock-icon">
									<Icon icon={ lockSmall } size={ 24 } />
								</span>
							</Tooltip>
						) }
					</Flex>
				</HStack>
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					className="edit-site-patterns__dropdown"
					popoverProps={ { placement: 'bottom-end' } }
					toggleProps={ {
						className: 'edit-site-patterns__button',
						describedBy: sprintf(
							/* translators: %s: pattern name */
							__( 'Action menu for %s pattern' ),
							item.title
						),
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ isCustomPattern && ! hasThemeFile && (
								<RenameMenuItem
									item={ item }
									onClose={ onClose }
								/>
							) }
							<DuplicateMenuItem
								categoryId={ categoryId }
								item={ item }
								onClose={ onClose }
								label={
									isNonUserPattern
										? __( 'Copy to My patterns' )
										: __( 'Duplicate' )
								}
							/>
							{ isCustomPattern && (
								<MenuItem
									isDestructive={ ! hasThemeFile }
									onClick={ () =>
										setIsDeleteDialogOpen( true )
									}
								>
									{ hasThemeFile
										? __( 'Clear customizations' )
										: __( 'Delete' ) }
								</MenuItem>
							) }
						</MenuGroup>
					) }
				</DropdownMenu>
			</HStack>

			{ isDeleteDialogOpen && (
				<ConfirmDialog
					confirmButtonText={ confirmButtonText }
					onConfirm={ deleteItem }
					onCancel={ () => setIsDeleteDialogOpen( false ) }
				>
					{ confirmPrompt }
				</ConfirmDialog>
			) }
		</li>
	);
}

export default memo( GridItem );
