/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import {
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';

import { useState, useCallback } from '@wordpress/element';
import { useInstanceId, useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockPreview from '../block-preview';
import SetupToolbar from './setup-toolbar';
import usePatternsSetup from './use-patterns-setup';
import { VIEWMODES } from './constants';

function useBackgroundColor() {
	const [ backgroundColor, setBackgroundColor ] = useState( 'rgba(0,0,0,0)' );
	const ref = useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;
			const canvas = ownerDocument.querySelector(
				'.editor-styles-wrapper'
			);
			if ( ! canvas ) {
				return;
			}
			const computedBackgroundColor = defaultView
				.getComputedStyle( canvas, null )
				.getPropertyValue( 'background-color' );
			if ( computedBackgroundColor !== backgroundColor ) {
				setBackgroundColor( computedBackgroundColor );
			}
		},
		[ backgroundColor, setBackgroundColor ]
	);
	return [ backgroundColor, ref ];
}

const SetupContent = ( {
	viewMode,
	activeSlide,
	patterns,
	onBlockPatternSelect,
	height,
} ) => {
	const composite = useCompositeState();
	const containerClass = 'block-editor-block-pattern-setup__container';
	const [ backgroundColor, nodeRef ] = useBackgroundColor();
	if ( viewMode === VIEWMODES.carousel ) {
		const slideClass = new Map( [
			[ activeSlide, 'active-slide' ],
			[ activeSlide - 1, 'previous-slide' ],
			[ activeSlide + 1, 'next-slide' ],
		] );
		return (
			<div
				className="block-editor-block-pattern-setup__carousel"
				style={ { backgroundColor, height } }
				ref={ nodeRef }
			>
				<div className={ containerClass }>
					<ul className="carousel-container">
						{ patterns.map( ( pattern, index ) => (
							<BlockPatternSlide
								className={ slideClass.get( index ) || '' }
								key={ pattern.name }
								pattern={ pattern }
							/>
						) ) }
					</ul>
				</div>
			</div>
		);
	}
	return (
		<Composite
			{ ...composite }
			role="listbox"
			className={ containerClass }
			aria-label={ __( 'Patterns list' ) }
		>
			{ patterns.map( ( pattern ) => (
				<BlockPattern
					key={ pattern.name }
					pattern={ pattern }
					onSelect={ onBlockPatternSelect }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
};

function BlockPattern( { pattern, onSelect, composite } ) {
	const baseClassName = 'block-editor-block-pattern-setup-list';
	const { blocks, description, viewportWidth = 700 } = pattern;
	const descriptionId = useInstanceId(
		BlockPattern,
		`${ baseClassName }__item-description`
	);
	return (
		<div
			className={ `${ baseClassName }__list-item` }
			aria-label={ pattern.title }
			aria-describedby={ pattern.description ? descriptionId : undefined }
		>
			<CompositeItem
				role="option"
				as="div"
				{ ...composite }
				className={ `${ baseClassName }__item` }
				onClick={ () => onSelect( blocks ) }
			>
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ viewportWidth }
				/>
			</CompositeItem>
			{ !! description && (
				<VisuallyHidden id={ descriptionId }>
					{ description }
				</VisuallyHidden>
			) }
		</div>
	);
}

function BlockPatternSlide( { className, pattern } ) {
	const { blocks, title, description } = pattern;
	const descriptionId = useInstanceId(
		BlockPatternSlide,
		'block-editor-block-pattern-setup-list__item-description'
	);
	return (
		<li
			className={ `pattern-slide ${ className }` }
			aria-label={ title }
			aria-describedby={ description ? descriptionId : undefined }
		>
			<BlockPreview blocks={ blocks } />
			{ !! description && (
				<VisuallyHidden id={ descriptionId }>
					{ description }
				</VisuallyHidden>
			) }
		</li>
	);
}

const BlockPatternSetup = ( {
	clientId,
	blockName,
	filterPatternsFn,
	startBlankComponent,
	onBlockPatternSelect,
} ) => {
	const [ viewMode, setViewMode ] = useState( VIEWMODES.carousel );
	const [ activeSlide, setActiveSlide ] = useState( 0 );
	const [ showBlank, setShowBlank ] = useState( false );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const patterns = usePatternsSetup( clientId, blockName, filterPatternsFn );
	const [
		contentResizeListener,
		{ height: contentHeight },
	] = useResizeObserver();

	if ( ! patterns?.length || showBlank ) {
		return startBlankComponent;
	}

	const onBlockPatternSelectDefault = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		replaceBlock( clientId, clonedBlocks );
	};
	const onPatternSelectCallback =
		onBlockPatternSelect || onBlockPatternSelectDefault;
	const onStartBlank = startBlankComponent
		? () => {
				setShowBlank( true );
		  }
		: undefined;
	return (
		<>
			{ contentResizeListener }
			<div
				className={ `block-editor-block-pattern-setup view-mode-${ viewMode }` }
			>
				<SetupContent
					viewMode={ viewMode }
					activeSlide={ activeSlide }
					patterns={ patterns }
					onBlockPatternSelect={ onPatternSelectCallback }
					height={ contentHeight - 2 * 60 }
				/>
				<SetupToolbar
					viewMode={ viewMode }
					setViewMode={ setViewMode }
					activeSlide={ activeSlide }
					totalSlides={ patterns.length }
					handleNext={ () => {
						setActiveSlide( ( active ) => active + 1 );
					} }
					handlePrevious={ () => {
						setActiveSlide( ( active ) => active - 1 );
					} }
					onBlockPatternSelect={ () => {
						onPatternSelectCallback(
							patterns[ activeSlide ].blocks
						);
					} }
					onStartBlank={ onStartBlank }
				/>
			</div>
		</>
	);
};

export default BlockPatternSetup;
