/**
 * External dependencies
 */
import { Composite, useCompositeState } from 'reakit';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';
import { useEffect } from '@wordpress/element';

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
} ) {
	const composite = useCompositeState();
	const orderId = items.reduce( ( acc, item ) => acc + '--' + item.id, '' );

	// This ensures the composite state refreshes when the list order changes.
	useEffect( () => {
		composite.unstable_sort();
	}, [ composite.unstable_sort, orderId ] );

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
					/>
				);
			} ) }
			{ children }
		</Composite>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
