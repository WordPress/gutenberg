/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { BlockQuotation } from '@wordpress/components';
import { useDispatch, useRegistry } from '@wordpress/data';
import { Platform, useEffect } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { verse } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { migrateToQuoteV2 } from './deprecated';
import { Caption } from '../utils/caption';

const isWebPlatform = Platform.OS === 'web';

const TEMPLATE = [ [ 'core/paragraph', {} ] ];

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
	const { updateBlockAttributes, replaceInnerBlocks } =
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

		registry.batch( () => {
			updateBlockAttributes( clientId, newAttributes );
			replaceInnerBlocks( clientId, newInnerBlocks );
		} );
	}, [ attributes.value ] );
};

export default function QuoteEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
	clientId,
	className,
	style,
	isSelected,
} ) {
	const { textAlign } = attributes;

	useMigrateOnLoad( attributes, clientId );

	const blockProps = useBlockProps( {
		className: clsx( className, {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		...( ! isWebPlatform && { style } ),
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		templateInsertUpdatesSelection: true,
		__experimentalCaptureToolbars: true,
		renderAppender: false,
	} );

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<BlockQuotation { ...innerBlocksProps }>
				{ innerBlocksProps.children }
				<Caption
					attributeKey="citation"
					tagName={ isWebPlatform ? 'cite' : 'p' }
					style={ isWebPlatform && { display: 'block' } }
					isSelected={ isSelected }
					attributes={ attributes }
					setAttributes={ setAttributes }
					__unstableMobileNoFocusOnMount
					icon={ verse }
					label={ __( 'Quote citation' ) }
					placeholder={
						// translators: placeholder text used for the
						// citation
						__( 'Add citation' )
					}
					addLabel={ __( 'Add citation' ) }
					removeLabel={ __( 'Remove citation' ) }
					className="wp-block-quote__citation"
					insertBlocksAfter={ insertBlocksAfter }
					{ ...( ! isWebPlatform ? { textAlign } : {} ) }
				/>
			</BlockQuotation>
		</>
	);
}
