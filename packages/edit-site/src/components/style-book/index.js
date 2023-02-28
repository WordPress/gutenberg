/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	TabPanel,
	createSlotFill,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	getCategories,
	getBlockTypes,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { closeSmall } from '@wordpress/icons';
import {
	useResizeObserver,
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { useMemo, memo } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { getMarginBoxValuesFromShadowValue } from './utils';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

const SLOT_FILL_NAME = 'EditSiteStyleBook';
const { Slot: StyleBookSlot, Fill: StyleBookFill } =
	createSlotFill( SLOT_FILL_NAME );

function getExamples() {
	// Use our own example for the Heading block so that we can show multiple
	// heading levels.
	const headingsExample = {
		name: 'core/heading',
		title: __( 'Headings' ),
		category: 'text',
		blocks: [
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 1,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 2,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 3,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 4,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 5,
			} ),
		],
	};

	const otherExamples = getBlockTypes()
		.filter( ( blockType ) => {
			const { name, example, supports } = blockType;
			return (
				name !== 'core/heading' &&
				!! example &&
				supports.inserter !== false
			);
		} )
		.map( ( blockType ) => ( {
			name: blockType.name,
			title: blockType.title,
			category: blockType.category,
			blocks: getBlockFromExample( blockType.name, blockType.example ),
		} ) );

	return [ headingsExample, ...otherExamples ];
}

function StyleBook( { isSelected, onSelect, onClose } ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const sectionFocusReturnRef = useFocusReturn();

	const [ textColor ] = useGlobalStyle( 'color.text' );
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const examples = useMemo( getExamples, [] );
	const tabs = useMemo(
		() =>
			getCategories()
				.filter( ( category ) =>
					examples.some(
						( example ) => example.category === category.slug
					)
				)
				.map( ( category ) => ( {
					name: category.slug,
					title: category.title,
					icon: category.icon,
				} ) ),
		[ examples ]
	);

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			onClose();
		}
	}

	return (
		<StyleBookFill>
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<section
				className={ classnames( 'edit-site-style-book', {
					'is-wide': sizes.width > 600,
				} ) }
				style={ {
					color: textColor,
					background: backgroundColor,
				} }
				aria-label={ __( 'Style Book' ) }
				onKeyDown={ closeOnEscape }
				ref={ useMergeRefs( [
					sectionFocusReturnRef,
					focusOnMountRef,
				] ) }
			>
				{ resizeObserver }
				<Button
					className="edit-site-style-book__close-button"
					icon={ closeSmall }
					label={ __( 'Close Style Book' ) }
					onClick={ onClose }
					showTooltip={ false }
				/>
				<TabPanel
					className="edit-site-style-book__tab-panel"
					tabs={ tabs }
				>
					{ ( tab ) => (
						<Examples
							examples={ examples }
							category={ tab.name }
							isSelected={ isSelected }
							onSelect={ onSelect }
						/>
					) }
				</TabPanel>
			</section>
		</StyleBookFill>
	);
}

const Examples = memo( ( { examples, category, isSelected, onSelect } ) => (
	<div className="edit-site-style-book__examples">
		{ examples
			.filter( ( example ) => example.category === category )
			.map( ( example ) => (
				<Example
					key={ example.name }
					name={ example.name }
					title={ example.title }
					blocks={ example.blocks }
					isSelected={ isSelected( example.name ) }
					onClick={ () => {
						onSelect( example.name );
					} }
				/>
			) ) }
	</div>
) );

function useShadowValueFromInnerBlocks( block ) {
	const [ firstInnerBlockShadow ] = useGlobalStyle(
		'shadow',
		block?.innerBlocks?.[ 0 ]?.name
	);

	const [ lastInnerBlockShadow ] = useGlobalStyle(
		'shadow',
		block?.innerBlocks?.[ ( block?.innerBlocks?.length || 1 ) - 1 ]?.name
	);

	return firstInnerBlockShadow || lastInnerBlockShadow;
}

const Example = memo( ( { name, title, blocks, isSelected, onClick } ) => {
	let cssRules = '';

	const [ shadow ] = useGlobalStyle( 'shadow', name );
	const innerShadow = useShadowValueFromInnerBlocks( blocks );
	const foundShadow = shadow || innerShadow;

	// If a shadow is found for either the block or its first/last inner block,
	// add a margin to the preview that is big enough to accommodate the shadow.
	if ( foundShadow ) {
		const marginBoxValues =
			getMarginBoxValuesFromShadowValue( foundShadow );

		[ 'left', 'top', 'right', 'bottom' ].forEach( ( side ) => {
			if ( marginBoxValues[ side ] ) {
				cssRules += `.is-root-container { margin-${ side }: ${ marginBoxValues[ side ] }; }`;
			}
		} );
	}

	// Ensure that margin is not applied to the first and last blocks within the preview.
	// This prevents block-level margin styles from unexpectedly affecting the preview.
	cssRules += `.is-root-container > .wp-block:first-child { margin-top: 0 }`;
	cssRules += `.is-root-container > .wp-block:last-child { margin-bottom: 0 }`;

	return (
		<button
			className={ classnames( 'edit-site-style-book__example', {
				'is-selected': isSelected,
			} ) }
			aria-label={ sprintf(
				// translators: %s: Title of a block, e.g. Heading.
				__( 'Open %s styles in Styles panel' ),
				title
			) }
			onClick={ onClick }
		>
			<span className="edit-site-style-book__example-title">
				{ title }
			</span>
			<div className="edit-site-style-book__example-preview">
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ 0 }
					additionalStyles={ [
						{
							css: cssRules,
						},
					] }
				/>
			</div>
		</button>
	);
} );

function useHasStyleBook() {
	const fills = useSlotFills( SLOT_FILL_NAME );
	return !! fills?.length;
}

StyleBook.Slot = StyleBookSlot;
export default StyleBook;
export { useHasStyleBook };
