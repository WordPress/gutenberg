/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	Disabled,
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
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
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

const { ExperimentalBlockEditorProvider, useGlobalStyle } = unlock(
	blockEditorPrivateApis
);

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

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
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
						<Iframe
							head={
								<>
									<EditorStyles styles={ settings.styles } />
									<style>{
										// Forming a "block formatting context" to prevent margin collapsing.
										// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
										`.is-root-container { display: flow-root; }
										body { position: relative; padding: 32px !important; }

										.edit-site-style-book__examples {
											max-width: 900px;
											margin: 0 auto;
										}

										.edit-site-style-book__example {
											background: none;
											border-radius: 2px;
											border: none;
											color: inherit;
											cursor: pointer;
											display: flex;
											flex-direction: column;
											gap: 40px;
											margin-bottom: 40px;
											padding: 16px;
											width: 100%;
											box-sizing: border-box;
										}

										.edit-site-style-book__example.is-selected {
											box-shadow: 0 0 0 1px var(--wp-admin-theme-color);
										}

										.edit-site-style-book__examples.is-wide .edit-site-style-book__example {
											flex-direction: row;
										}

										.edit-site-style-book__example-title {
											font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
											font-size: 11px;
											font-weight: 500;
											line-height: normal;
											margin: 0;
											text-align: left;
											text-transform: uppercase;
										}

										.edit-site-style-book__examples.is-wide .edit-site-style-book__example-title {
											text-align: right;
											width: 120px;
										}

										.edit-site-style-book__example-preview {
											width: 100%;
										}

										.edit-site-style-book__example-preview .is-root-container > .wp-block:first-child {
											margin-top: 0;
										}
										.edit-site-style-book__example-preview .is-root-container > .wp-block:last-child {
											margin-bottom: 0;
										}
										`
									}</style>
								</>
							}
							tabIndex={ 0 }
						>
							{ /* Filters need to be rendered before children to avoid Safari rendering issues. */ }
							{ settings.svgFilters }
							<Examples
								className={ classnames(
									'edit-site-style-book__examples',
									{
										'is-wide': sizes.width > 600,
									}
								) }
								examples={ examples }
								category={ tab.name }
								isSelected={ isSelected }
								onSelect={ onSelect }
							/>
						</Iframe>
					) }
				</TabPanel>
			</section>
		</StyleBookFill>
	);
}

const Examples = memo(
	( { className, examples, category, isSelected, onSelect } ) => (
		<div className={ className }>
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
	)
);

const Example = memo( ( { title, blocks, isSelected, onClick } ) => {
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);

	/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
	return (
		<div
			className={ classnames( 'edit-site-style-book__example', {
				'is-selected': isSelected,
			} ) }
			aria-label={ sprintf(
				// translators: %s: Title of a block, e.g. Heading.
				__( 'Open %s styles in Styles panel' ),
				title
			) }
			onClick={ onClick }
			tabIndex={ 0 }
		>
			<span className="edit-site-style-book__example-title">
				{ title }
			</span>
			<div className="edit-site-style-book__example-preview">
				<Disabled className="edit-site-style-book__example-preview__content">
					<ExperimentalBlockEditorProvider
						value={ Array.isArray( blocks ) ? blocks : [ blocks ] }
						settings={ settings }
					>
						<BlockList renderAppender={ false } />
					</ExperimentalBlockEditorProvider>
				</Disabled>
			</div>
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
} );

function useHasStyleBook() {
	const fills = useSlotFills( SLOT_FILL_NAME );
	return !! fills?.length;
}

StyleBook.Slot = StyleBookSlot;
export default StyleBook;
export { useHasStyleBook };
