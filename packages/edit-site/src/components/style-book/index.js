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
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';
import { closeSmall } from '@wordpress/icons';
import { useResizeObserver } from '@wordpress/compose';
import { useMemo, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';

const { useGlobalStyle } = unlock( blockEditorExperiments );

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
	return (
		<StyleBookFill>
			<section
				className={ classnames( 'edit-site-style-book', {
					'is-wide': sizes.width > 600,
				} ) }
				style={ {
					color: textColor,
					background: backgroundColor,
				} }
				aria-label={ __( 'Style Book' ) }
			>
				{ resizeObserver }
				<Button
					className="edit-site-style-book__close-button"
					icon={ closeSmall }
					label={ __( 'Close Style Book' ) }
					onClick={ onClose }
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

const Example = memo( ( { title, blocks, isSelected, onClick } ) => (
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
		<span className="edit-site-style-book__example-title">{ title }</span>
		<div className="edit-site-style-book__example-preview">
			<BlockPreview
				blocks={ blocks }
				viewportWidth={ 0 }
				additionalStyles={ [
					{
						css:
							'.wp-block:first-child { margin-top: 0; }' +
							'.wp-block:last-child { margin-bottom: 0; }',
					},
				] }
			/>
		</div>
	</button>
) );

function useHasStyleBook() {
	const fills = useSlotFills( SLOT_FILL_NAME );
	return !! fills?.length;
}

StyleBook.Slot = StyleBookSlot;
export default StyleBook;
export { useHasStyleBook };
