/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

function TemplateAreaItem( { area, clientId } ) {
	const { selectBlock, toggleBlockHighlight } = useDispatch(
		blockEditorStore
	);
	const templatePartArea = useSelect(
		( select ) => {
			const defaultAreas = select(
				editorStore
			).__experimentalGetDefaultTemplatePartAreas();

			return defaultAreas.find(
				( defaultArea ) => defaultArea.area === area
			);
		},
		[ area ]
	);

	const highlightBlock = () => toggleBlockHighlight( clientId, true );
	const cancelHighlightBlock = () => toggleBlockHighlight( clientId, false );

	return (
		<Button
			className="edit-site-template-card__template-areas-item"
			icon={ templatePartArea?.icon }
			onMouseOver={ highlightBlock }
			onMouseLeave={ cancelHighlightBlock }
			onFocus={ highlightBlock }
			onBlur={ cancelHighlightBlock }
			onClick={ () => {
				selectBlock( clientId );
			} }
		>
			{ templatePartArea?.label }
		</Button>
	);
}

export default function TemplateAreas() {
	const templateParts = useSelect(
		( select ) => select( editSiteStore ).getCurrentTemplateTemplateParts(),
		[]
	);

	if ( ! templateParts.length ) {
		return null;
	}

	return (
		<section className="edit-site-template-card__template-areas">
			<Heading
				level={ 3 }
				className="edit-site-template-card__template-areas-title"
			>
				{ __( 'Areas' ) }
			</Heading>

			<ul className="edit-site-template-card__template-areas-list">
				{ templateParts.map( ( { templatePart, block } ) => (
					<li key={ templatePart.slug }>
						<TemplateAreaItem
							area={ templatePart.area }
							clientId={ block.clientId }
						/>
					</li>
				) ) }
			</ul>
		</section>
	);
}
