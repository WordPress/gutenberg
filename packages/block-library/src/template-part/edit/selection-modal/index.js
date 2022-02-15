/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import TemplatePartList from './template-part-list';
import PatternsList from './patterns-list';

export default function TemplatePartSelectionModal( {
	setAttributes,
	onClose,
	templatePartId = null,
	area,
	areaLabel,
	clientId,
} ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );

	const onTemplatePartSelect = useCallback( ( templatePart ) => {
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
	}, [] );

	const onBlockPatternSelect = async (
		startingBlocks = [],
		title = __( 'Untitled Template Part' )
	) => {
		// If we have `area` set from block attributes, means an exposed
		// block variation was inserted. So add this prop to the template
		// part entity on creation. Afterwards remove `area` value from
		// block attributes.
		const record = {
			title,
			slug: kebabCase( title ),
			content: serialize( startingBlocks ),
			// `area` is filterable on the server and defaults to `UNCATEGORIZED`
			// if provided value is not allowed.
			area,
		};
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			record
		);
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
			area: undefined,
		} );
	};

	return (
		<div className="block-library-template-part__selection">
			<div>
				<h2>{ __( 'Pick from the existing template parts' ) }</h2>
				<TemplatePartList
					area={ area }
					templatePartId={ templatePartId }
					onSelect={ onTemplatePartSelect }
				/>
			</div>

			<div>
				<h2>{ __( 'Pick from the existing patterns' ) }</h2>
				<PatternsList
					area={ area }
					areaLabel={ areaLabel }
					onSelect={ onBlockPatternSelect }
					clientId={ clientId }
				/>
			</div>
		</div>
	);
}
