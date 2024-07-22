/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

const TABS_TEMPLATE = [
	[ 'core/tab', { title: 'Tab 1' } ],
	[ 'core/tab', { title: 'Tab 2' } ],
];

const ALLOWED_FORMATS = [
	'core/bold',
	'core/code',
	'core/image',
	'core/italic',
	'core/keyboard',
	'core/language',
	'core/strikethrough',
	'core/subscript',
	'core/superscript',
	'core/text-color',
];

export default function Edit( { attributes, clientId, setAttributes } ) {
	const { activeTab } = attributes;
	const innerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);

	const blockProps = useBlockProps();

	const innerBlockProps = useInnerBlocksProps(
		{
			className: 'wp-block-tabs__content',
		},
		{
			renderAppender: InnerBlocks.ButtonBlockAppender,
			template: TABS_TEMPLATE,
		}
	);

	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const setActiveTab = ( tabId ) => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { activeTab: tabId } );
	};

	useEffect( () => {
		// Initialize the first tab as active when the component mounts.
		if ( innerBlocks.length ) {
			setActiveTab( innerBlocks[ 0 ].clientId );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps -- only run effect once when component mounts.

	// if ( ! innerBlocks || innerBlocks.length === 0 ) {
	// 	return null;
	// }

	return (
		<div { ...blockProps }>
			<ul className="wp-block-tabs__list" role="tablist">
				{ innerBlocks.map( ( block ) => {
					const isActive = block.clientId === activeTab;
					const tabIndex = isActive ? '0' : '-1';

					// TODO: Add unique ids and aria attributes for accessibility.
					// (Try the anchor generation functionality from the heading block?)
					return (
						<li
							key={ block.clientId }
							className="wp-block-tabs__list-item"
							role="presentation"
						>
							<button
								className={ clsx( 'wp-block-tabs__tab', {
									'is-active': isActive,
								} ) }
								onClick={ () => setActiveTab( block.clientId ) }
								role="tab"
								tabIndex={ tabIndex }
							>
								<RichText
									allowedFormats={ ALLOWED_FORMATS }
									tagName="span"
									value={ block.attributes.title }
									onChange={ ( value ) =>
										updateBlockAttributes( block.clientId, {
											title: value,
										} )
									}
								/>
							</button>
						</li>
					);
				} ) }
			</ul>

			<div { ...innerBlockProps }></div>
		</div>
	);
}
