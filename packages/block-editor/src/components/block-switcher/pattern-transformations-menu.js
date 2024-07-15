/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useInstanceId, useViewportMatch } from '@wordpress/compose';
import { chevronRight } from '@wordpress/icons';

import {
	Composite,
	MenuGroup,
	MenuItem,
	Popover,
	VisuallyHidden,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import useTransformedPatterns from './use-transformed-patterns';

function PatternTransformationsMenu( {
	blocks,
	patterns: statePatterns,
	onSelect,
} ) {
	const [ showTransforms, setShowTransforms ] = useState( false );
	const patterns = useTransformedPatterns( statePatterns, blocks );

	if ( ! patterns.length ) {
		return null;
	}

	return (
		<MenuGroup className="block-editor-block-switcher__pattern__transforms__menugroup">
			{ showTransforms && (
				<PreviewPatternsPopover
					patterns={ patterns }
					onSelect={ onSelect }
				/>
			) }
			<MenuItem
				onClick={ ( event ) => {
					event.preventDefault();
					setShowTransforms( ! showTransforms );
				} }
				icon={ chevronRight }
			>
				{ __( 'Patterns' ) }
			</MenuItem>
		</MenuGroup>
	);
}

function PreviewPatternsPopover( { patterns, onSelect } ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<div className="block-editor-block-switcher__popover-preview-container">
			<Popover
				className="block-editor-block-switcher__popover-preview"
				placement={ isMobile ? 'bottom' : 'right-start' }
				offset={ 16 }
			>
				<div className="block-editor-block-switcher__preview is-pattern-list-preview">
					<BlockPatternsList
						patterns={ patterns }
						onSelect={ onSelect }
					/>
				</div>
			</Popover>
		</div>
	);
}

function BlockPatternsList( { patterns, onSelect } ) {
	return (
		<Composite
			role="listbox"
			className="block-editor-block-switcher__preview-patterns-container"
			aria-label={ __( 'Patterns list' ) }
		>
			{ patterns.map( ( pattern ) => (
				<BlockPattern
					key={ pattern.name }
					pattern={ pattern }
					onSelect={ onSelect }
				/>
			) ) }
		</Composite>
	);
}

function BlockPattern( { pattern, onSelect } ) {
	// TODO check pattern/preview width...
	const baseClassName =
		'block-editor-block-switcher__preview-patterns-container';
	const descriptionId = useInstanceId(
		BlockPattern,
		`${ baseClassName }-list__item-description`
	);
	return (
		<div className={ `${ baseClassName }-list__list-item` }>
			<Composite.Item
				render={
					<div
						role="option"
						aria-label={ pattern.title }
						aria-describedby={
							pattern.description ? descriptionId : undefined
						}
						className={ `${ baseClassName }-list__item` }
					/>
				}
				onClick={ () => onSelect( pattern.transformedBlocks ) }
			>
				<BlockPreview
					blocks={ pattern.transformedBlocks }
					viewportWidth={ pattern.viewportWidth || 500 }
				/>
				<div className={ `${ baseClassName }-list__item-title` }>
					{ pattern.title }
				</div>
			</Composite.Item>
			{ !! pattern.description && (
				<VisuallyHidden id={ descriptionId }>
					{ pattern.description }
				</VisuallyHidden>
			) }
		</div>
	);
}

export default PatternTransformationsMenu;
