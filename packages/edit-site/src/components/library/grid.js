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
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { moreHorizontal } from '@wordpress/icons';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import { usePatterns, PATTERNS, USER_PATTERNS } from './use-patterns';

const DeleteMenuItem = ( { item, onClose } ) => {
	const { __experimentalDeleteReusableBlock } =
		useDispatch( reusableBlocksStore );

	if ( item.type !== USER_PATTERNS ) {
		return;
	}

	return (
		<MenuItem
			onClick={ () => {
				__experimentalDeleteReusableBlock( item.id );
				onClose();
			} }
		>
			{ __( 'Delete' ) }
		</MenuItem>
	);
};

const GridItem = ( { category, composite, item } ) => {
	const instanceId = useInstanceId( GridItem );
	const descriptionId = `edit-site-library__pattern-description-${ instanceId }`;

	const { onClick } = useLink( {
		path: '/library',
		postType: item.type,
		postId: item.type === USER_PATTERNS ? item.id : item.name,
		categoryName: category,
		categoryType: item.type,
		canvas: 'edit',
	} );

	return (
		<div
			className="edit-site-library__pattern"
			aria-label={ item.title }
			aria-describedby={ item.description ? descriptionId : undefined }
		>
			<CompositeItem
				className="edit-site-library__preview"
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
				<span>{ item.title }</span>
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

export default function Grid( { category, label, type } ) {
	const [ patterns, isResolving ] = usePatterns( type, category );
	const composite = useCompositeState( { orientation: 'vertical' } );

	if ( ! patterns ) {
		return null;
	}

	if ( ! patterns.length ) {
		// TODO: Implement redirecting to root library page or proper empty state.
		return (
			<div
				style={ {
					color: '#e0e0e0',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				{ __( 'No patterns found.' ) }
			</div>
		);
	}

	return (
		<Composite
			{ ...composite }
			role="listbox"
			className="edit-site-library__grid"
			aria-label={ label }
		>
			{ isResolving && __( 'Loading' ) }
			{ ! isResolving &&
				patterns.map( ( pattern ) => (
					<GridItem
						key={ pattern.name }
						item={ pattern }
						category={ category }
						composite={ composite }
					/>
				) ) }
		</Composite>
	);
}
