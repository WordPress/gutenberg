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
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { moreHorizontal } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import usePatterns from './use-patterns';

const GridItem = ( { item } ) => {
	const instanceId = useInstanceId( GridItem );
	const descriptionId = `edit-site-library__pattern-description-${ instanceId }`;

	return (
		<div
			className="edit-site-library__pattern"
			aria-label={ item.title }
			aria-describedby={ item.description ? descriptionId : undefined }
		>
			<div className="edit-site-library__preview">
				<BlockPreview blocks={ item.blocks } />
				{ !! item.description && (
					<VisuallyHidden id={ descriptionId }>
						{ item.description }
					</VisuallyHidden>
				) }
			</div>
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

export default function Grid( { type, category } ) {
	const [ patterns, isResolving ] = usePatterns( type, category );

	if ( ! patterns ) {
		return null;
	}

	if ( ! patterns.length ) {
		return <div>{ __( 'No patterns found.' ) }</div>;
	}

	return (
		<div className="edit-site-library__grid">
			{ isResolving && __( 'Loading' ) }
			{ ! isResolving &&
				patterns.map( ( pattern ) => (
					<GridItem key={ pattern.name } item={ pattern } />
				) ) }
		</div>
	);
}
