/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';

function BlockTypesList( { items, onSelect, onHover = () => {}, children } ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-editor-block-types-list">
			{ items && items.map( ( item ) => {
				if ( ! isEmpty( item.patterns ) ) {
					return item.patterns.map( ( pattern ) => {
						const customizedItem = {
							...item,
							initialAttributes: {
								...item.initialAttributes,
								...pattern.attributes,
							},
							innerBlocks: pattern.innerBlocks,
						};
						return (
							<InserterListItem
								key={ item.id + pattern.name }
								className={ getBlockMenuDefaultClassName( item.id ) }
								icon={ pattern.icon || item.icon }
								onClick={ () => {
									onSelect( customizedItem );
									onHover( null );
								} }
								onFocus={ () => onHover( customizedItem ) }
								onMouseEnter={ () => onHover( customizedItem ) }
								onMouseLeave={ () => onHover( null ) }
								onBlur={ () => onHover( null ) }
								isDisabled={ item.isDisabled }
								title={ item.title }
								patternName={ pattern.label }
							/>
						);
					} );
				}
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
					/>
				);
			} ) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
