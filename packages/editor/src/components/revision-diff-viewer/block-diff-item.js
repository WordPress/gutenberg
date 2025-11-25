/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, Button } from '@wordpress/components';
import { plus, trash, update, check } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * @typedef {import('./utils/types').BlockDiffItem} BlockDiffItem
 */

/**
 * Gets the icon for a diff type.
 *
 * @param {string} type - The diff type
 * @return {Object} The icon component
 */
function getDiffIcon( type ) {
	switch ( type ) {
		case 'added':
			return plus;
		case 'removed':
			return trash;
		case 'modified':
			return update;
		case 'unchanged':
		default:
			return check;
	}
}

/**
 * Gets a human-readable block name.
 *
 * @param {string} blockName - The block type name
 * @return {string} Human-readable name
 */
function getBlockLabel( blockName ) {
	if ( ! blockName ) {
		return __( 'Unknown Block' );
	}

	// Remove namespace and capitalize.
	const name = blockName.replace( /^core\//, '' );
	return name
		.split( '-' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
}

/**
 * Extracts a preview of block content.
 *
 * @param {Object} block - The block data
 * @return {string} Content preview
 */
function getContentPreview( block ) {
	if ( ! block || ! block.innerHTML ) {
		return '';
	}

	// Strip HTML tags and get first 100 characters.
	const text = block.innerHTML.replace( /<[^>]*>/g, '' ).trim();
	if ( text.length > 100 ) {
		return text.substring( 0, 100 ) + '...';
	}
	return text;
}

/**
 * Renders attribute changes for a modified block.
 *
 * @param {Object}   props                  - Component props
 * @param {Object[]} props.attributeChanges - Array of attribute changes
 * @return {JSX.Element|null} The rendered changes or null
 */
function AttributeChanges( { attributeChanges } ) {
	if ( ! attributeChanges || attributeChanges.length === 0 ) {
		return null;
	}

	return (
		<div className="revision-diff-viewer__attribute-changes">
			<h5>{ __( 'Changed attributes:' ) }</h5>
			<ul>
				{ attributeChanges.map( ( change, index ) => (
					<li key={ index }>
						<strong>{ change.attribute }:</strong>
						<span className="revision-diff-viewer__old-value">
							{ JSON.stringify( change.oldValue ) }
						</span>
						<span className="revision-diff-viewer__arrow">→</span>
						<span className="revision-diff-viewer__new-value">
							{ JSON.stringify( change.newValue ) }
						</span>
					</li>
				) ) }
			</ul>
		</div>
	);
}

/**
 * Individual block diff item component.
 *
 * @param {Object}        props      - Component props
 * @param {BlockDiffItem} props.item - The block diff item to display
 * @return {JSX.Element} The rendered component
 */
export function BlockDiffItem( { item } ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	const icon = getDiffIcon( item.type );
	const label = getBlockLabel( item.blockName );
	const preview =
		getContentPreview( item.newBlock ) ||
		getContentPreview( item.oldBlock );

	const hasDetails =
		( item.attributeChanges && item.attributeChanges.length > 0 ) ||
		( item.innerBlocksDiff && item.innerBlocksDiff.length > 0 );

	const typeClass = `revision-diff-viewer__item--${ item.type }`;

	return (
		<div className={ `revision-diff-viewer__item ${ typeClass }` }>
			<div className="revision-diff-viewer__item-header">
				<Icon
					icon={ icon }
					className="revision-diff-viewer__item-icon"
				/>
				<span className="revision-diff-viewer__item-label">
					{ label }
				</span>
				<span className="revision-diff-viewer__item-type">
					{ item.type }
				</span>
				{ hasDetails && (
					<Button
						variant="tertiary"
						onClick={ () => setIsExpanded( ! isExpanded ) }
						className="revision-diff-viewer__expand-button"
						__next40pxDefaultSize
					>
						{ isExpanded ? __( 'Collapse' ) : __( 'Details' ) }
					</Button>
				) }
			</div>

			{ preview && (
				<div className="revision-diff-viewer__item-preview">
					{ preview }
				</div>
			) }

			{ isExpanded && (
				<div className="revision-diff-viewer__item-details">
					<AttributeChanges
						attributeChanges={ item.attributeChanges }
					/>

					{ item.innerBlocksDiff &&
						item.innerBlocksDiff.length > 0 && (
							<div className="revision-diff-viewer__nested-blocks">
								<h5>{ __( 'Nested block changes:' ) }</h5>
								{ item.innerBlocksDiff.map( ( nested ) => (
									<BlockDiffItem
										key={ nested.id }
										item={ nested }
									/>
								) ) }
							</div>
						) }
				</div>
			) }
		</div>
	);
}
