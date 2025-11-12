/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import {
	SearchControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
} from './utils/hooks';
import { mapTemplatePartToBlockPattern } from './utils/map-template-part-to-block-pattern';
import { searchPatterns } from '../../utils/search-patterns';

export default function TemplatePartSelectionModal( {
	setAttributes,
	onClose,
	templatePartId = null,
	area,
	clientId,
} ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const { templateParts } = useAlternativeTemplateParts(
		area,
		templatePartId
	);

	// We can map template parts to block patters to reuse the BlockPatternsList UI
	const filteredTemplateParts = useMemo( () => {
		const partsAsPatterns = templateParts.map( ( templatePart ) =>
			mapTemplatePartToBlockPattern( templatePart )
		);

		return searchPatterns( partsAsPatterns, searchValue );
	}, [ templateParts, searchValue ] );
	const blockPatterns = useAlternativeBlockPatterns( area, clientId );
	const filteredBlockPatterns = useMemo( () => {
		return searchPatterns( blockPatterns, searchValue );
	}, [ blockPatterns, searchValue ] );

	const { createSuccessNotice } = useDispatch( noticesStore );

	const onTemplatePartSelect = ( templatePart ) => {
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
			area: undefined,
		} );
		createSuccessNotice(
			sprintf(
				/* translators: %s: template part title. */
				__( 'Template Part "%s" inserted.' ),
				templatePart.title?.rendered || templatePart.slug
			),
			{
				type: 'snackbar',
			}
		);
		onClose();
	};

	const hasTemplateParts = !! filteredTemplateParts.length;
	const hasBlockPatterns = !! filteredBlockPatterns.length;

	return (
		<div className="block-library-template-part__selection-content">
			<div className="block-library-template-part__selection-search">
				<SearchControl
					__nextHasNoMarginBottom
					onChange={ setSearchValue }
					value={ searchValue }
					label={ __( 'Search' ) }
					placeholder={ __( 'Search' ) }
				/>
			</div>
			{ hasTemplateParts && (
				<div>
					<h2>{ __( 'Existing template parts' ) }</h2>
					<BlockPatternsList
						blockPatterns={ filteredTemplateParts }
						onClickPattern={ ( pattern ) => {
							onTemplatePartSelect( pattern.templatePart );
						} }
					/>
				</div>
			) }

			{ ! hasTemplateParts && ! hasBlockPatterns && (
				<HStack alignment="center">
					<p>{ __( 'No results found.' ) }</p>
				</HStack>
			) }
		</div>
	);
}
