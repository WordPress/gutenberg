/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { BlockPreview } from '@wordpress/block-editor';
import {
	__unstableComposite as Composite,
	__unstableCompositeItem as CompositeItem,
	__unstableUseCompositeState as useCompositeState,
} from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../utils/create-template-part-id';

function PreviewPlaceholder() {
	return (
		<div
			className="wp-block-template-part__selection-preview-item is-placeholder"
			tabIndex={ 0 }
		/>
	);
}

function TemplatePartItem( { templatePart, onSelect, composite } ) {
	const {
		slug,
		title: { rendered: title },
	} = templatePart;
	// The 'raw' property is not defined for a brief period in the save cycle.
	// The fallback prevents an error in the parse function while saving.
	const content = templatePart.content.raw || '';
	const blocks = useMemo( () => parse( content ), [ content ] );

	return (
		<CompositeItem
			as="div"
			className="block-library-template-part__selection-list-item"
			role="option"
			onClick={ () => onSelect( templatePart ) }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onSelect( templatePart );
				}
			} }
			tabIndex={ 0 }
			aria-label={ title || slug }
			{ ...composite }
		>
			<BlockPreview blocks={ blocks } />
			<div className="block-library-template-part__selection-list-item-title">
				{ title || slug }
			</div>
		</CompositeItem>
	);
}

export default function TemplatePartList( { area, templatePartId, onSelect } ) {
	const composite = useCompositeState();

	const templateParts = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				per_page: -1,
			}
		);
	}, [] );

	const templatePartsToShow = useMemo( () => {
		if ( ! templateParts ) {
			return [];
		}
		return (
			templateParts.filter(
				( templatePart ) =>
					createTemplatePartId(
						templatePart.theme,
						templatePart.slug
					) !== templatePartId &&
					( ! area ||
						'uncategorized' === area ||
						templatePart.area === area )
			) || []
		);
	}, [ templateParts, area ] );

	const currentShownTPs = useAsyncList( templatePartsToShow );

	if ( ! templateParts || ! templateParts.length ) {
		return __( 'There are no existing template parts to select.' );
	}

	return (
		<Composite
			{ ...composite }
			role="listbox"
			aria-label={ __( 'List of template parts' ) }
			className="block-library-template-part__selection-list-items"
		>
			{ templateParts.map( ( templatePart ) => {
				return currentShownTPs.includes( templatePart ) ? (
					<TemplatePartItem
						key={ templatePart.id }
						templatePart={ templatePart }
						composite={ composite }
						onSelect={ onSelect }
					/>
				) : (
					<PreviewPlaceholder key={ templatePart.id } />
				);
			} ) }
		</Composite>
	);
}
