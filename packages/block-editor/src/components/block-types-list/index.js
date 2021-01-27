/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';

function BlockTypesList( {
	items = [],
	onSelect,
	onHover = () => {},
	children,
	label,
	isDraggable = true,
} ) {
	const composite = useCompositeState();
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<Composite
			{ ...composite }
			role="listbox"
			className="block-editor-block-types-list"
			aria-label={ label }
		>
			{ items.map( ( item ) => {
				return (
					<InserterListItem
						key={ item.id }
						item={ item }
						className={ getBlockMenuDefaultClassName( item.id ) }
						onSelect={ onSelect }
						onHover={ onHover }
						composite={ composite }
						isDraggable={ isDraggable }
					/>
				);
			} ) }
			{ children }
		</Composite>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
