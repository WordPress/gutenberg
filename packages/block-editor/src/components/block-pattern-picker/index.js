/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import {
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';

import { useState, useMemo } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockPreview from '../block-preview';
import LayoutSetupToolbar from './layout-setup-toolbar';
import usePatternsSetup from './use-patterns-setup';

const LayoutSetupStep = ( {
	viewMode,
	activeSlide,
	patterns,
	onBlockPatternSelect,
} ) => {
	const composite = useCompositeState();
	let content;
	// Render `carousel` in single viewMode.
	if ( viewMode === 'single' ) {
		const getSlideClass = ( index ) => {
			if ( index === activeSlide ) return 'active-slide';
			if ( index === activeSlide - 1 ) return 'previous-slide';
			if ( index === activeSlide + 1 ) return 'next-slide';
			return '';
		};
		content = (
			<div className="block-layout-setup__container">
				<ul className="carousel-container">
					{ patterns.map( ( pattern, index ) => {
						return (
							<BlockPatternSlide
								viewMode="single"
								className={ getSlideClass( index ) }
								key={ pattern.name }
								pattern={ pattern }
								onSelect={ onBlockPatternSelect }
								composite={ composite }
							/>
						);
					} ) }
				</ul>
			</div>
		);
	} else {
		content = (
			<Composite
				{ ...composite }
				role="listbox"
				className="block-layout-setup__container"
				aria-label={ __( 'Layout list' ) }
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
	}
	return content;
};

function BlockPattern( { pattern, onSelect, composite } ) {
	// TODO check viewportWidth. From pattern? From resizeObserver to have current width
	// and manipulate later??
	const { content } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );
	const descriptionId = useInstanceId(
		BlockPattern,
		'block-setup-block-layout-list__item-description'
	);
	return (
		<div
			className="block-setup-block-layout-list__list-item"
			aria-label={ pattern.title }
			aria-describedby={ pattern.description ? descriptionId : undefined }
		>
			<CompositeItem
				role="option"
				as="div"
				{ ...composite }
				className="block-setup-block-layout-list__item"
				onClick={ () => onSelect( blocks ) }
			>
				<BlockPreview blocks={ blocks } viewportWidth={ 900 } />
			</CompositeItem>
			{ !! pattern.description && (
				<VisuallyHidden id={ descriptionId }>
					{ pattern.description }
				</VisuallyHidden>
			) }
		</div>
	);
}

function BlockPatternSlide( { className, pattern } ) {
	const { content } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );
	const descriptionId = useInstanceId(
		BlockPatternSlide,
		'block-setup-block-layout-list__item-description'
	);
	return (
		<li
			className={ `pattern-slide ${ className }` }
			aria-label={ pattern.title }
			aria-describedby={ pattern.description ? descriptionId : undefined }
		>
			<BlockPreview
				blocks={ blocks }
				__experimentalLive
				// viewportWidth={ viewportWidth }
			/>
			{ !! pattern.description && (
				<VisuallyHidden id={ descriptionId }>
					{ pattern.description }
				</VisuallyHidden>
			) }
		</li>
	);
}

const BlockPatternPicker = ( {
	clientId,
	blockName,
	filterPatternsFn,
	startBlankComponent,
	// onBlockPatternSelect = () => {}, // TODO check if needs override support.
} ) => {
	const [ viewMode, setViewMode ] = useState( 'single' );
	const [ activeSlide, setActiveSlide ] = useState( 0 );
	const [ showBlank, setShowBlank ] = useState( false );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const patterns = usePatternsSetup( blockName, filterPatternsFn );

	// Todo render fallback :)
	if ( ! patterns?.length || showBlank ) {
		return startBlankComponent;
	}

	const onBlockPatternSelect = ( blocks ) => {
		replaceBlock( clientId, blocks );
	};
	return (
		<div
			className={ `layout-placeholder-container view-mode-${ viewMode }` }
		>
			<LayoutSetupToolbar
				viewMode={ viewMode }
				setViewMode={ setViewMode }
				activeSlide={ activeSlide }
				totalSlides={ +patterns?.length }
				handleNext={ () => {
					setActiveSlide( ( active ) => active + 1 );
				} }
				handlePrevious={ () => {
					setActiveSlide( ( active ) => active - 1 );
				} }
				onBlockPatternSelect={ () => {
					const { content } = patterns[ activeSlide ];
					onBlockPatternSelect( parse( content ) );
				} }
				onStartBlank={ () => {
					setShowBlank( true );
				} }
			/>
			<LayoutSetupStep
				viewMode={ viewMode }
				activeSlide={ activeSlide }
				patterns={ patterns }
				onBlockPatternSelect={ onBlockPatternSelect }
			/>
		</div>
	);
};

export default BlockPatternPicker;
