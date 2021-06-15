/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { chevronRight } from '@wordpress/icons';

import {
	MenuGroup,
	MenuItem,
	Popover,
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
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
	if ( ! patterns.length ) return null;

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
	return (
		<div className="block-editor-block-switcher__popover__preview__parent">
			<div className="block-editor-block-switcher__popover__preview__container">
				<Popover
					className="block-editor-block-switcher__preview__popover"
					position="bottom right"
				>
					<div className="block-editor-block-switcher__preview">
						<div className="block-editor-block-switcher__preview-title">
							{ __( 'Preview' ) }
						</div>
						<BlockPatternsList
							patterns={ patterns }
							onSelect={ onSelect }
						/>
					</div>
				</Popover>
			</div>
		</div>
	);
}

function BlockPatternsList( { patterns, onSelect } ) {
	const composite = useCompositeState();
	return (
		<Composite
			{ ...composite }
			role="listbox"
			className="block-editor-block-switcher__preview-patterns-container"
			aria-label={ __( 'Patterns list' ) }
		>
			{ patterns.map( ( pattern ) => (
				<BlockPattern
					key={ pattern.name }
					pattern={ pattern }
					onSelect={ onSelect }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}

function BlockPattern( { pattern, onSelect, composite } ) {
	// TODO check pattern/preview width...
	const baseClassName =
		'block-editor-block-switcher__preview-patterns-container';
	const descriptionId = useInstanceId(
		BlockPattern,
		`${ baseClassName }-list__item-description`
	);
	return (
		<div
			className={ `${ baseClassName }-list__list-item` }
			aria-label={ pattern.title }
			aria-describedby={ pattern.description ? descriptionId : undefined }
		>
			<CompositeItem
				role="option"
				as="div"
				{ ...composite }
				className={ `${ baseClassName }-list__item` }
				onClick={ () => onSelect( pattern.transformedBlocks ) }
			>
				<BlockPreview
					blocks={ pattern.transformedBlocks }
					viewportWidth={ pattern.viewportWidth || 500 }
				/>
				<div className={ `${ baseClassName }-list__item-title` }>
					{ pattern.title }
				</div>
			</CompositeItem>
			{ !! pattern.description && (
				<VisuallyHidden id={ descriptionId }>
					{ pattern.description }
				</VisuallyHidden>
			) }
		</div>
	);
}

export default PatternTransformationsMenu;
