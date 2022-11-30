/**
 * External dependencies
 */
import { colord } from 'colord';
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
import { __ } from '@wordpress/i18n';
import {
	getCategories,
	getBlockTypes,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import { closeSmall } from '@wordpress/icons';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useStyle } from '../global-styles';

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
		.filter(
			( blockType ) =>
				blockType.name !== 'core/heading' && !! blockType.example
		)
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
	const [ backgroundColor ] = useStyle( 'color.background' );
	const backgroundColord = colord( backgroundColor );
	const examples = getExamples();
	return (
		<StyleBookFill>
			<div
				className={ classnames( 'edit-site-style-book', {
					'is-wide': sizes.width > 600,
					'has-dark-background':
						backgroundColord.luminance() <= 0.5 &&
						backgroundColord.alpha() !== 0,
				} ) }
				style={ {
					background: backgroundColor,
				} }
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
					tabs={ getCategories()
						.filter( ( category ) =>
							examples.some(
								( example ) =>
									example.category === category.slug
							)
						)
						.map( ( category ) => ( {
							name: category.slug,
							title: category.title,
							icon: category.icon,
						} ) ) }
				>
					{ ( tab ) => (
						<div className="edit-site-style-book__examples">
							{ examples
								.filter(
									( example ) => example.category === tab.name
								)
								.map( ( example ) => (
									<Example
										key={ example.name }
										title={ example.title }
										blocks={ example.blocks }
										isSelected={ isSelected(
											example.name
										) }
										onClick={ () => {
											onSelect( example.name );
										} }
									/>
								) ) }
						</div>
					) }
				</TabPanel>
			</div>
		</StyleBookFill>
	);
}

function Example( { title, blocks, isSelected, onClick } ) {
	return (
		<button
			className={ classnames( 'edit-site-style-book__example', {
				'is-selected': isSelected,
			} ) }
			onClick={ onClick }
		>
			<h3 className="edit-site-style-book__example-title">{ title }</h3>
			<div className="edit-site-style-book__example-preview">
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ 0 }
					__experimentalStyles={ [
						{
							css:
								'.wp-block:first-child { margin-top: 0; }' +
								'.wp-block:last-child { margin-bottom: 0; }',
						},
					] }
				/>
			</div>
		</button>
	);
}
function useHasStyleBook() {
	const fills = useSlotFills( SLOT_FILL_NAME );
	return !! fills?.length;
}

StyleBook.Slot = StyleBookSlot;
export default StyleBook;
export { useHasStyleBook };
