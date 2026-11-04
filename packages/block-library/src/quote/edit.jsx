import clsx from 'clsx';
import { __, _x, isRTL } from '@wordpress/i18n';
import {
	AlignmentControl,
	BlockControls,
	privateApis as blockEditorPrivateApis,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { BlockQuotation } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { alignCenter, alignLeft, alignRight, verse } from '@wordpress/icons';
import { migrateToQuoteV2 } from './deprecated';
import { Caption } from '../utils/caption';
import { unlock } from '../lock-unlock';

/**
 * At the moment, deprecations don't handle create blocks from attributes
 * (like when using CPT templates). For this reason, this hook is necessary
 * to avoid breaking templates using the old quote block format.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} clientId   Block client ID.
 */
const useMigrateOnLoad = ( attributes, clientId ) => {
	const registry = useRegistry();
	const { updateBlockAttributes, replaceInnerBlocks, selectBlock } =
		useDispatch( blockEditorStore );
	useEffect( () => {
		// As soon as the block is loaded, migrate it to the new version.

		if ( ! attributes.value ) {
			// No need to migrate if it doesn't have the value attribute.
			return;
		}

		const [ newAttributes, newInnerBlocks ] =
			migrateToQuoteV2( attributes );

		deprecated( 'Value attribute on the quote block', {
			since: '6.0',
			version: '6.5',
			alternative: 'inner blocks',
		} );

		// The selection can be inside an inner block created from the block
		// type template at insertion, which the migration replaces; restore
		// the selection to the migrated block in that case.
		const shouldReselectBlock = registry
			.select( blockEditorStore )
			.hasSelectedInnerBlock( clientId, true );

		registry.batch( () => {
			updateBlockAttributes( clientId, newAttributes );
			replaceInnerBlocks( clientId, newInnerBlocks );
			if ( shouldReselectBlock ) {
				selectBlock( clientId );
			}
		} );
	}, [ attributes.value ] );
};

const { BlockOptionsMenuControls, BlockOptionsMenuItem } = unlock(
	blockEditorPrivateApis
);

const isBlockToolbarRedesign = !! window.__experimentalBlockToolbarRedesign;

const TEXT_ALIGNMENTS = [
	{
		value: 'left',
		label: _x( 'Left', 'Text alignment option' ),
		icon: alignLeft,
	},
	{
		value: 'center',
		label: _x( 'Center', 'Text alignment option' ),
		icon: alignCenter,
	},
	{
		value: 'right',
		label: _x( 'Right', 'Text alignment option' ),
		icon: alignRight,
	},
];

export default function QuoteEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
	clientId,
	className,
	isSelected,
} ) {
	const { textAlign, allowedBlocks } = attributes;
	const currentTextAlign = textAlign ?? ( isRTL() ? 'right' : 'left' );

	const { hasInnerBlocks } = useSelect(
		( select ) => {
			const { getBlockCount } = select( blockEditorStore );
			return {
				hasInnerBlocks: getBlockCount( clientId ) > 0,
			};
		},
		[ clientId ]
	);

	useMigrateOnLoad( attributes, clientId );

	const blockProps = useBlockProps( {
		className: clsx( className, {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		__experimentalCaptureToolbars: true,
		renderAppender: hasInnerBlocks ? false : undefined,
		allowedBlocks,
	} );

	return (
		<>
			{ isBlockToolbarRedesign ? (
				// The redesigned toolbar offers text alignment in the options
				// menu, as it does for paragraphs.
				<BlockOptionsMenuControls>
					<BlockOptionsMenuItem
						group="align"
						name="text-align"
						label={ __( 'Text' ) }
						icon={
							TEXT_ALIGNMENTS.find(
								( { value } ) => value === currentTextAlign
							)?.icon
						}
						choices={ TEXT_ALIGNMENTS }
						value={ currentTextAlign }
						onChange={ ( nextAlign ) =>
							setAttributes( { textAlign: nextAlign } )
						}
					/>
				</BlockOptionsMenuControls>
			) : (
				<BlockControls group="block">
					<AlignmentControl
						value={ textAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { textAlign: nextAlign } );
						} }
					/>
				</BlockControls>
			) }
			<BlockQuotation { ...innerBlocksProps }>
				{ innerBlocksProps.children }
				<Caption
					attributeKey="citation"
					tagName="cite"
					style={ { display: 'block' } }
					isSelected={ isSelected }
					attributes={ attributes }
					setAttributes={ setAttributes }
					icon={ verse }
					label={ __( 'Quote citation' ) }
					placeholder={
						// translators: placeholder text used for the
						// citation
						__( 'Add citation' )
					}
					addLabel={ __( 'Add citation' ) }
					removeLabel={ __( 'Remove citation' ) }
					// The redesigned toolbar labels actions whose icon is not
					// one people know from across the web.
					showTextLabel={ isBlockToolbarRedesign }
					excludeElementClassName
					className="wp-block-quote__citation"
					insertBlocksAfter={ insertBlocksAfter }
				/>
			</BlockQuotation>
		</>
	);
}
