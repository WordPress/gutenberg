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

import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockPreview from '../block-preview';
import SetupToolbar from './setup-toolbar';
import usePatternsSetup from './use-patterns-setup';
import { VIEWMODES } from './constants';

const SetupContent = ( {
	viewMode,
	activeSlide,
	patterns,
	onBlockPatternSelect,
} ) => {
	const composite = useCompositeState();
	const containerClass = 'block-editor-block-pattern-setup__container';
	if ( viewMode === VIEWMODES.carousel ) {
		const slideClass = new Map( [
			[ activeSlide, 'active-slide' ],
			[ activeSlide - 1, 'previous-slide' ],
			[ activeSlide + 1, 'next-slide' ],
		] );
		return (
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
	const { blocks, title, description, viewportWidth = 700 } = pattern;
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
				<div className={ `${ baseClassName }__item-title` }>
					{ title }
				</div>
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
			<BlockPreview blocks={ blocks } __experimentalLive />
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
} ) => {
	const [ viewMode, setViewMode ] = useState( VIEWMODES.carousel );
	const [ activeSlide, setActiveSlide ] = useState( 0 );
	const [ showBlank, setShowBlank ] = useState( false );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const patterns = usePatternsSetup( clientId, blockName, filterPatternsFn );

	if ( ! patterns?.length || showBlank ) {
		return startBlankComponent;
	}

	const onBlockPatternSelect = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		replaceBlock( clientId, clonedBlocks );
	};
	return (
		<div
			className={ `block-editor-block-pattern-setup view-mode-${ viewMode }` }
		>
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
					onBlockPatternSelect( patterns[ activeSlide ].blocks );
				} }
				onStartBlank={ () => {
					setShowBlank( true );
				} }
			/>
			<SetupContent
				viewMode={ viewMode }
				activeSlide={ activeSlide }
				patterns={ patterns }
				onBlockPatternSelect={ onBlockPatternSelect }
			/>
		</div>
	);
};

export default BlockPatternSetup;
