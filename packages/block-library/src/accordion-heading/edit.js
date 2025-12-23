/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	RichText,
	getTypographyClassesAndStyles as useTypographyProps,
	useSettings,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { ENTER } from '@wordpress/keycodes';

export default function Edit( {
	attributes,
	setAttributes,
	context,
	clientId,
} ) {
	const { title } = attributes;
	const {
		'core/accordion-icon-position': iconPosition,
		'core/accordion-show-icon': showIcon,
		'core/accordion-heading-level': headingLevel,
	} = context;
	const TagName = 'h' + headingLevel;

	// Set icon attributes.
	useEffect( () => {
		if ( iconPosition !== undefined && showIcon !== undefined ) {
			setAttributes( {
				iconPosition,
				showIcon,
			} );
		}
	}, [ iconPosition, showIcon, setAttributes ] );

	const [ fluidTypographySettings, layout ] = useSettings(
		'typography.fluid',
		'layout'
	);
	const typographyProps = useTypographyProps( attributes, {
		typography: {
			fluid: fluidTypographySettings,
		},
		layout: {
			wideSize: layout?.wideSize,
		},
	} );

	const blockProps = useBlockProps();
	const spacingProps = useSpacingProps( attributes );

	const { selectBlock, insertBlock } = useDispatch( blockEditorStore );

	const { panelClientId, firstPanelBlockClientId } = useSelect(
		( select ) => {
			const { getBlock, getBlockParents, getBlocks } =
				select( blockEditorStore );

			const parents = getBlockParents( clientId );
			const accordionItemId = parents.find( ( parentId ) => {
				const block = getBlock( parentId );
				return block?.name === 'core/accordion-item';
			} );

			if ( ! accordionItemId ) {
				return {
					panelClientId: null,
					firstPanelBlockClientId: null,
				};
			}

			const accordionItem = getBlock( accordionItemId );
			const panelBlock = accordionItem?.innerBlocks?.find(
				( block ) => block.name === 'core/accordion-panel'
			);

			if ( ! panelBlock ) {
				return {
					panelClientId: null,
					firstPanelBlockClientId: null,
				};
			}

			const panelBlocks = getBlocks( panelBlock.clientId );
			const firstBlock = panelBlocks?.[ 0 ];

			return {
				panelClientId: panelBlock.clientId,
				firstPanelBlockClientId: firstBlock?.clientId,
			};
		},
		[ clientId ]
	);

	const handleKeyDown = ( event ) => {
		if ( event.keyCode === ENTER && ! event.shiftKey ) {
			event.preventDefault();
			event.stopPropagation();

			if ( firstPanelBlockClientId ) {
				selectBlock( firstPanelBlockClientId );
			} else if ( panelClientId ) {
				const newParagraphBlock = createBlock( 'core/paragraph' );
				insertBlock( newParagraphBlock, 0, panelClientId, true );
			}
		}
	};

	return (
		<TagName { ...blockProps }>
			<button
				className="wp-block-accordion-heading__toggle"
				style={ spacingProps.style }
				tabIndex="-1"
			>
				{ showIcon && iconPosition === 'left' && (
					<span
						className="wp-block-accordion-heading__toggle-icon"
						aria-hidden="true"
					>
						+
					</span>
				) }
				<RichText
					withoutInteractiveFormatting
					disableLineBreaks
					tagName="span"
					value={ title }
					onChange={ ( newTitle ) =>
						setAttributes( { title: newTitle } )
					}
					onKeyDown={ handleKeyDown }
					placeholder={ __( 'Accordion title' ) }
					className="wp-block-accordion-heading__toggle-title"
					style={ {
						letterSpacing: typographyProps.style.letterSpacing,
						textDecoration: typographyProps.style.textDecoration,
					} }
				/>
				{ showIcon && iconPosition === 'right' && (
					<span
						className="wp-block-accordion-heading__toggle-icon"
						aria-hidden="true"
					>
						+
					</span>
				) }
			</button>
		</TagName>
	);
}
