/**
 * External dependencies
 */
import { Composite, useCompositeState } from 'reakit';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';
import { includeVariationsInInserterItems } from '../inserter/utils';

function BlockTypesList( {
	items = [],
	onSelect,
	onHover = () => {},
	children,
	label,
} ) {
	const composite = useCompositeState();
	const normalizedItems = includeVariationsInInserterItems( items );

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<Composite
			as="ul"
			role="listbox"
			{ ...composite }
			className="block-editor-block-types-list"
			aria-label={ label }
		>
			{ normalizedItems.map( ( item ) => {
				return (
					<InserterListItem
						key={ item.id }
						className={ getBlockMenuDefaultClassName( item.id ) }
						icon={ item.icon }
						onClick={ () => {
							onSelect( item );
							onHover( null );
						} }
						onFocus={ () => onHover( item ) }
						onMouseEnter={ () => onHover( item ) }
						onMouseLeave={ () => onHover( null ) }
						onBlur={ () => onHover( null ) }
						isDisabled={ item.isDisabled }
						title={ item.title }
						composite={ composite }
					/>
				);
			} ) }
			{ children }
		</Composite>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
