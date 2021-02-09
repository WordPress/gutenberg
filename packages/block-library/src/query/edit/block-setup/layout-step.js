/**
 * WordPress dependencies
 */
import { ENTER, SPACE } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { parse, store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import {
	BlockPreview,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Button, VisuallyHidden } from '@wordpress/components';

const LayoutSetupStep = ( {
	blockType,
	onVariationSelect,
	onBlockPatternSelect,
} ) => {
	const { defaultVariation, scopeVariations, patterns } = useSelect(
		( select ) => {
			const { getBlockVariations, getDefaultBlockVariation } = select(
				blocksStore
			);
			const { getSettings } = select( blockEditorStore );
			const { __experimentalBlockPatterns: allPatterns } = getSettings();
			const { name, isMatchingBlockPattern } = blockType;
			let _patterns;
			if ( isMatchingBlockPattern ) {
				_patterns = allPatterns?.filter( isMatchingBlockPattern );
			}
			return {
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				scopeVariations: getBlockVariations( name, 'block' ),
				patterns: _patterns,
			};
		},
		[ blockType ]
	);
	// TODO check about `useAsyncList`
	return (
		<div className="layout-step-container">
			<BlockVariationPicker
				variations={ scopeVariations }
				onSelect={ ( nextVariation = defaultVariation ) =>
					onVariationSelect( nextVariation )
				}
			/>
			{ !! patterns.length && (
				<PatternsPicker
					patterns={ patterns }
					onSelect={ onBlockPatternSelect }
				/>
			) }
		</div>
	);
};

function PatternsPicker( { patterns, onSelect } ) {
	return (
		<div
			className="block-patterns-picker-container"
			aria-label={ __( 'Block Patterns' ) }
		>
			<h6>{ __( 'Available block patterns' ) }</h6>
			<div
				className="block-patterns-picker-container__grid"
				aria-label={ __( 'Block Patterns' ) }
			>
				{ patterns.map( ( pattern ) => (
					<BlockPattern
						key={ pattern.name }
						pattern={ pattern }
						onSelect={ onSelect }
					/>
				) ) }
			</div>
		</div>
	);
}

function BlockPattern( { pattern, onSelect } ) {
	const { content, viewportWidth } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );
	const instanceId = useInstanceId( BlockPattern );
	const descriptionId = `block-editor-block-patterns-list__item-description-${ instanceId }`;

	return (
		<div
			className="block-patterns-list-item"
			role="button"
			onClick={ () => onSelect( blocks ) }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onSelect( blocks );
				}
			} }
			tabIndex={ 0 }
			aria-label={ pattern.title }
			aria-describedby={ pattern.description ? descriptionId : undefined }
		>
			<BlockPreview blocks={ blocks } viewportWidth={ viewportWidth } />
			<div className="block-editor-block-patterns-list__item-title">
				{ pattern.title }
			</div>
			{ !! pattern.description && (
				<VisuallyHidden id={ descriptionId }>
					{ pattern.description }
				</VisuallyHidden>
			) }
		</div>
	);
}

function BlockVariationPicker( { variations, onSelect, allowSkip } ) {
	return (
		<div className="block-variations-picker-container">
			<h6>{ __( 'Block variations' ) }</h6>
			{ /*
			 * Disable reason: The `list` ARIA role is redundant but
			 * Safari+VoiceOver won't announce the list otherwise.
			 */
			/* eslint-disable jsx-a11y/no-redundant-roles */ }
			<ul
				className="block-editor-block-variation-picker__variations"
				role="list"
				aria-label={ __( 'Block variations' ) }
			>
				{ variations.map( ( variation ) => (
					<li key={ variation.name }>
						<Button
							isSecondary
							icon={ variation.icon }
							iconSize={ 48 }
							onClick={ () => onSelect( variation ) }
							className="block-editor-block-variation-picker__variation"
							label={ variation.description || variation.title }
						/>
						<span
							className="block-editor-block-variation-picker__variation-label"
							role="presentation"
						>
							{ variation.title }
						</span>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			{ allowSkip && (
				<div className="block-editor-block-variation-picker__skip">
					<Button isLink onClick={ () => onSelect() }>
						{ __( 'Skip' ) }
					</Button>
				</div>
			) }
		</div>
	);
}

export default LayoutSetupStep;
