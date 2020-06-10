/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';

function BlockTypesList( {
	items = [],
	onSelect,
	onHover = () => {},
	children,
} ) {
	const normalizedItems = items.reduce( ( result, item ) => {
		const {
			id: itemId,
			icon: itemIcon,
			title: itemTitle,
			description: itemDescription,
			example: itemExample,
			initialAttributes,
			variations = [],
		} = item;
		const hasDefaultVariation = variations.some(
			( { isDefault } ) => isDefault
		);

		// If there is no default inserter variation provided,
		// then default block type is displayed.
		if ( ! hasDefaultVariation ) {
			result.push( item );
		}

		if ( variations.length ) {
			result = result.concat(
				variations.map( ( variation ) => {
					const {
						name,
						icon,
						title,
						description,
						example,
						attributes,
						innerBlocks,
					} = variation;
					return {
						...item,
						id: `${ itemId }-${ name }`,
						icon: icon || itemIcon,
						title: title || itemTitle,
						description: description || itemDescription,
						// If `example` is explicitly undefined for the variation, the preview will not be shown.
						example: variation.hasOwnProperty( 'example' )
							? example
							: itemExample,
						initialAttributes: {
							...initialAttributes,
							...attributes,
						},
						innerBlocks,
					};
				} )
			);
		}

		return result;
	}, [] );

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-editor-block-types-list">
			{ normalizedItems.map( ( item ) => {
				const { id, icon, isDisabled, title, role } = item;
				return (
					<InserterListItem
						key={ id }
						className={ getBlockMenuDefaultClassName( id ) }
						icon={ icon }
						onClick={ () => {
							onSelect( item );
							onHover( null );
						} }
						onFocus={ () => onHover( item ) }
						onMouseEnter={ () => onHover( item ) }
						onMouseLeave={ () => onHover( null ) }
						onBlur={ () => onHover( null ) }
						isDisabled={ isDisabled }
						title={ title }
						role={ role }
					/>
				);
			} ) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
