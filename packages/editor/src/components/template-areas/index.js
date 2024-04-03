/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalHeading as Heading,
} from '@wordpress/components';

import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function TemplateAreaItem( { area, clientId } ) {
	const { selectBlock, toggleBlockHighlight } =
		useDispatch( blockEditorStore );
	const templatePartArea = useSelect(
		( select ) => {
			const defaultAreas =
				select(
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
			className="editor-template-areas__item"
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
		( select ) =>
			unlock( select( editorStore ) ).getCurrentTemplateTemplateParts(),
		[]
	);

	if ( ! templateParts.length ) {
		return null;
	}

	return (
		<section className="editor-template-areas">
			<Heading level={ 3 } className="editor-template-areas__title">
				{ __( 'Areas' ) }
			</Heading>

			<ul className="editor-template-areas__list">
				{ templateParts.map( ( { templatePart, block } ) => (
					<li key={ block.clientId }>
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
