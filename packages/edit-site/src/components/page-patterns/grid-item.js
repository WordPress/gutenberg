/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalHStack as HStack,
	__unstableCompositeItem as CompositeItem,
	Tooltip,
	Flex,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Icon,
	header,
	footer,
	symbolFilled as uncategorized,
	moreHorizontal,
	lockSmall,
} from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { DELETE, BACKSPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import RenameMenuItem from './rename-menu-item';
import DuplicateMenuItem from './duplicate-menu-item';
import { PATTERNS, TEMPLATE_PARTS, USER_PATTERNS } from './utils';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';

const templatePartIcons = { header, footer, uncategorized };

export default function GridItem( { categoryId, composite, icon, item } ) {
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

	const onKeyDown = ( event ) => {
		if ( DELETE === event.keyCode || BACKSPACE === event.keyCode ) {
			setIsDeleteDialogOpen( true );
		}
	};

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
		ariaDescriptions.push( __( 'Theme patterns cannot be edited.' ) );
	}

	const itemIcon = templatePartIcons[ categoryId ]
		? templatePartIcons[ categoryId ]
		: icon;

	const confirmButtonText = hasThemeFile ? __( 'Clear' ) : __( 'Delete' );
	const confirmPrompt = hasThemeFile
		? __( 'Are you sure you want to clear these customizations?' )
		: sprintf(
				// translators: %s: The pattern or template part's title e.g. 'Call to action'.
				__( 'Are you sure you want to delete "%s"?' ),
				item.title
		  );

	return (
		<>
			<div className={ patternClassNames }>
				<CompositeItem
					className={ previewClassNames }
					role="option"
					as="div"
					{ ...composite }
					onClick={ item.type !== PATTERNS ? onClick : undefined }
					onKeyDown={ isCustomPattern ? onKeyDown : undefined }
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
				</CompositeItem>
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
					aria-hidden="true"
					className="edit-site-patterns__footer"
					justify="space-between"
				>
					<HStack
						alignment="center"
						justify="left"
						spacing={ 3 }
						className="edit-site-patterns__pattern-title"
					>
						{ icon && (
							<Icon
								className="edit-site-patterns__pattern-icon"
								icon={ itemIcon }
							/>
						) }
						<Flex as="span" gap={ 0 } justify="left">
							{ item.title }
							{ item.type === PATTERNS && (
								<Tooltip
									position="top center"
									text={ __(
										'Theme patterns cannot be edited.'
									) }
								>
									<span className="edit-site-patterns__pattern-lock-icon">
										<Icon icon={ lockSmall } size={ 24 } />
									</span>
								</Tooltip>
							) }
						</Flex>
					</HStack>
					<DropdownMenu
						icon={ moreHorizontal }
						label={ __( 'Actions' ) }
						className="edit-site-patterns__dropdown"
						popoverProps={ { placement: 'bottom-end' } }
						toggleProps={ {
							className: 'edit-site-patterns__button',
							isSmall: true,
							describedBy: sprintf(
								/* translators: %s: pattern name */
								__( 'Action menu for %s pattern' ),
								item.title
							),
							// The dropdown menu is not focusable using the
							// keyboard as this would interfere with the grid's
							// roving tab index system. Instead, keyboard users
							// use keyboard shortcuts to trigger actions.
							tabIndex: -1,
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
			</div>
			{ isDeleteDialogOpen && (
				<ConfirmDialog
					confirmButtonText={ confirmButtonText }
					onConfirm={ deleteItem }
					onCancel={ () => setIsDeleteDialogOpen( false ) }
				>
					{ confirmPrompt }
				</ConfirmDialog>
			) }
		</>
	);
}
