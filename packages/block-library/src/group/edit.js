/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
	useInnerBlocksProps,
	useSetting,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { View } from '@wordpress/primitives';
import { useEffect } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import GroupPlaceHolder, { useShouldShowPlaceHolder } from './placeholder';

/**
 * Render inspector controls for the Group block.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.tagName         The HTML tag name.
 * @param {Function} props.onSelectTagName onChange function for the SelectControl.
 *
 * @return {JSX.Element}                The control group.
 */
function GroupEditControls( { tagName, onSelectTagName } ) {
	const htmlElementMessages = {
		header: __(
			'The <header> element should represent introductory content, typically a group of introductory or navigational aids.'
		),
		main: __(
			'The <main> element should be used for the primary content of your document only. '
		),
		section: __(
			"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
		),
		article: __(
			'The <article> element should represent a self-contained, syndicatable portion of the document.'
		),
		aside: __(
			"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
		),
		footer: __(
			'The <footer> element should represent a footer for its nearest sectioning element (e.g.: <section>, <article>, <main> etc.).'
		),
	};
	return (
		<InspectorControls group="advanced">
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'HTML element' ) }
				options={ [
					{ label: __( 'Default (<div>)' ), value: 'div' },
					{ label: '<header>', value: 'header' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
					{ label: '<aside>', value: 'aside' },
					{ label: '<footer>', value: 'footer' },
				] }
				value={ tagName }
				onChange={ onSelectTagName }
				help={ htmlElementMessages[ tagName ] }
			/>
		</InspectorControls>
	);
}

function GroupEdit( {
	attributes,
	name,
	setAttributes,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const {
		tagName: TagName = 'div',
		templateLock,
		allowedBlocks,
		layout = {},
		slug,
	} = attributes;

	const { hasInnerBlocks, themeSupportsLayout, selectedPattern } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
				themeSupportsLayout: getSettings()?.supportsLayout,
				selectedPattern:
					select( blockEditorStore ).__experimentalGetParsedPattern(
						slug
					),
			};
		},
		[ clientId, slug ]
	);

	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	// Run this effect when the component loads.
	// This adds the Pattern's contents to the post.
	// This change won't be saved.
	// It will continue to pull from the pattern file unless changes are made to its respective template part.
	useEffect( () => {
		if ( slug && selectedPattern?.blocks && ! hasInnerBlocks ) {
			// We batch updates to block list settings to avoid triggering cascading renders
			// for each container block included in a tree and optimize initial render.
			// Since the above uses microtasks, we need to use a microtask here as well,
			// because nested pattern blocks cannot be inserted if the parent block supports
			// inner blocks but doesn't have blockSettings in the state.
			window.queueMicrotask( () => {
				__unstableMarkNextChangeAsNotPersistent();
				replaceInnerBlocks(
					clientId,
					selectedPattern.blocks.map( ( block ) =>
						cloneBlock( block )
					)
				);
			} );
		}
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		clientId,
		hasInnerBlocks,
		replaceInnerBlocks,
		selectedPattern?.blocks,
		slug,
	] );

	// Layout settings.
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = ! layout?.type
		? { ...defaultLayout, ...layout, type: 'default' }
		: { ...defaultLayout, ...layout };
	const { type = 'default' } = usedLayout;
	const layoutSupportEnabled =
		themeSupportsLayout || type === 'flex' || type === 'grid';

	// Hooks.
	const blockProps = useBlockProps( {
		className: ! layoutSupportEnabled ? layoutClassNames : null,
	} );
	const [ showPlaceholder, setShowPlaceholder ] = useShouldShowPlaceHolder( {
		attributes,
		usedLayoutType: usedLayout?.type,
		hasInnerBlocks,
	} );

	// Default to the regular appender being rendered.
	let renderAppender;
	if ( showPlaceholder ) {
		// In the placeholder state, ensure the appender is not rendered.
		// This is needed because `...innerBlocksProps` is used in the placeholder
		// state so that blocks can dragged onto the placeholder area
		// from both the list view and in the editor canvas.
		renderAppender = false;
	} else if ( ! hasInnerBlocks ) {
		// When there is no placeholder, but the block is also empty,
		// use the larger button appender.
		renderAppender = InnerBlocks.ButtonBlockAppender;
	}

	const innerBlocksProps = useInnerBlocksProps(
		layoutSupportEnabled
			? blockProps
			: { className: 'wp-block-group__inner-container' },
		{
			templateLock,
			allowedBlocks,
			renderAppender,
			__unstableDisableLayoutClassNames: ! layoutSupportEnabled,
		}
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const selectVariation = ( nextVariation ) => {
		setAttributes( nextVariation.attributes );
		selectBlock( clientId, -1 );
		setShowPlaceholder( false );
	};

	return (
		<>
			<GroupEditControls
				tagName={ TagName }
				onSelectTagName={ ( value ) =>
					setAttributes( { tagName: value } )
				}
			/>
			{ showPlaceholder && (
				<View>
					{ innerBlocksProps.children }
					<GroupPlaceHolder
						clientId={ clientId }
						name={ name }
						onSelect={ selectVariation }
					/>
				</View>
			) }
			{ layoutSupportEnabled && ! showPlaceholder && (
				<TagName { ...innerBlocksProps } />
			) }
			{ /* Ideally this is not needed but it's there for backward compatibility reason
				to keep this div for themes that might rely on its presence */ }
			{ ! layoutSupportEnabled && ! showPlaceholder && (
				<TagName { ...blockProps }>
					<div { ...innerBlocksProps } />
				</TagName>
			) }
		</>
	);
}

export default GroupEdit;
