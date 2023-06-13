/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	VisuallyHidden,
	__experimentalHStack as HStack,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, moreHorizontal } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import { PATTERNS, USER_PATTERNS } from './use-patterns';

const DeleteMenuItem = ( { item, onClose } ) => {
	const { invalidateResolution } = useDispatch( coreStore );
	const { __experimentalDeleteReusableBlock } =
		useDispatch( reusableBlocksStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	if ( item.type !== USER_PATTERNS ) {
		return;
	}

	const deleteReusableBlock = async () => {
		try {
			await __experimentalDeleteReusableBlock( item.id );
			invalidateResolution( 'getEntityRecords', [
				'taxonomy',
				'wp_pattern',
				{ per_page: -1, hide_empty: false, context: 'view' },
			] );
			createSuccessNotice( __( 'Pattern successfully deleted.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while deleting the pattern.' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			onClose();
		}
	};

	return (
		<MenuItem onClick={ deleteReusableBlock }>{ __( 'Delete' ) }</MenuItem>
	);
};

const GridItem = ( { categoryId, composite, icon, item } ) => {
	const instanceId = useInstanceId( GridItem );
	const descriptionId = `edit-site-library__pattern-description-${ instanceId }`;

	const { onClick } = useLink( {
		path: '/library',
		postType: item.type,
		postId: item.type === USER_PATTERNS ? item.id : item.name,
		categoryId,
		categoryType: item.type,
		canvas: 'edit',
	} );

	const previewClassNames = classnames( 'edit-site-library__preview', {
		'is-inactive': item.type === PATTERNS,
	} );

	return (
		<div
			className="edit-site-library__pattern"
			aria-label={ item.title }
			aria-describedby={ item.description ? descriptionId : undefined }
		>
			<CompositeItem
				className={ previewClassNames }
				role="option"
				as="div"
				{ ...composite }
				onClick={ item.type !== PATTERNS ? onClick : undefined }
			>
				<BlockPreview blocks={ item.blocks } />
				{ !! item.description && (
					<VisuallyHidden id={ descriptionId }>
						{ item.description }
					</VisuallyHidden>
				) }
			</CompositeItem>
			<HStack
				className="edit-site-library__footer"
				justify="space-between"
			>
				<HStack
					alignment="center"
					justify="left"
					className="edit-site-library__pattern-title"
				>
					{ icon && <Icon icon={ icon } /> }
					<span>{ item.title }</span>
				</HStack>
				{ item.type === USER_PATTERNS && (
					<DropdownMenu
						icon={ moreHorizontal }
						label={ __( 'Actions' ) }
						className="edit-site-library__dropdown"
						popoverProps={ { placement: 'bottom-end' } }
						toggleProps={ {
							className: 'edit-site-library__button',
							isSmall: true,
						} }
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<DeleteMenuItem
									item={ item }
									onClose={ onClose }
								/>
							</MenuGroup>
						) }
					</DropdownMenu>
				) }
			</HStack>
		</div>
	);
};

export default GridItem;
