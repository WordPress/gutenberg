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
	__experimentalHeading as Heading,
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
	symbolFilled,
	moreHorizontal,
	lockSmall,
} from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { DELETE, BACKSPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { PATTERNS, USER_PATTERNS } from './utils';
import { useLink } from '../routes/link';

const THEME_PATTERN_TOOLTIP = __( 'Theme patterns cannot be edited.' );

export default function GridItem( { categoryId, composite, icon, item } ) {
	const descriptionId = useId();
	const [ isDeleteDialogOpen, setIsDeleteDialogOpen ] = useState( false );

	const { __experimentalDeleteReusableBlock } =
		useDispatch( reusableBlocksStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const { onClick } = useLink( {
		postType: item.type,
		postId: item.type === USER_PATTERNS ? item.id : item.name,
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
		'is-inactive': item.type === PATTERNS,
	} );

	const deletePattern = async () => {
		try {
			await __experimentalDeleteReusableBlock( item.id );
			createSuccessNotice( __( 'Pattern successfully deleted.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while deleting the pattern.' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

	const isUserPattern = item.type === USER_PATTERNS;
	const ariaDescriptions = [];
	if ( isUserPattern ) {
		// User patterns don't have descriptions, but can be edited and deleted, so include some help text.
		ariaDescriptions.push(
			__( 'Press Enter to edit, or Delete to delete the pattern.' )
		);
	} else if ( item.description ) {
		ariaDescriptions.push( item.description );
	}
	if ( item.type === PATTERNS ) {
		ariaDescriptions.push( THEME_PATTERN_TOOLTIP );
	}

	let itemIcon = icon;
	if ( categoryId === 'header' ) {
		itemIcon = header;
	} else if ( categoryId === 'footer' ) {
		itemIcon = footer;
	} else if ( categoryId === 'uncategorized' ) {
		itemIcon = symbolFilled;
	}

	return (
		<>
			<div className={ patternClassNames }>
				<CompositeItem
					className={ previewClassNames }
					role="option"
					as="div"
					{ ...composite }
					onClick={ item.type !== PATTERNS ? onClick : undefined }
					onKeyDown={ isUserPattern ? onKeyDown : undefined }
					aria-label={ item.title }
					aria-describedby={
						ariaDescriptions.length
							? ariaDescriptions.join( ' ' )
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
						<Flex
							as={ Heading }
							level={ 5 }
							gap={ 0 }
							justify="left"
						>
							{ item.title }
							{ item.type === PATTERNS && (
								<Tooltip
									position="top center"
									text={ __(
										'Theme patterns cannot be edited.'
									) }
								>
									<span className="edit-site-patterns__pattern-lock-icon">
										<Icon
											style={ { fill: 'currentcolor' } }
											icon={ lockSmall }
											size={ 24 }
										/>
									</span>
								</Tooltip>
							) }
						</Flex>
					</HStack>
					{ item.type === USER_PATTERNS && (
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
							{ () => (
								<MenuGroup>
									<MenuItem
										onClick={ () =>
											setIsDeleteDialogOpen( true )
										}
									>
										{ __( 'Delete' ) }
									</MenuItem>
								</MenuGroup>
							) }
						</DropdownMenu>
					) }
				</HStack>
			</div>
			{ isDeleteDialogOpen && (
				<ConfirmDialog
					onConfirm={ deletePattern }
					onCancel={ () => setIsDeleteDialogOpen( false ) }
				>
					{ __( 'Are you sure you want to delete this pattern?' ) }
				</ConfirmDialog>
			) }
		</>
	);
}
