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
import { __ } from '@wordpress/i18n';
import { moreHorizontal } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import usePatterns from './use-patterns';

const GridItem = ( { composite, item } ) => {
	const instanceId = useInstanceId( GridItem );
	const descriptionId = `edit-site-library__pattern-description-${ instanceId }`;

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
				onClick={ () => {
					// TODO: Implement pattern editing flow.
				} }
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
							<MenuItem
								onClick={ () => {
									// TODO: Implement pattern / template part deletion.
									onClose();
								} }
							>
								{ __( 'Delete' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
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
		return <div>{ __( 'No patterns found.' ) }</div>;
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
						composite={ composite }
					/>
				) ) }
		</Composite>
	);
}
