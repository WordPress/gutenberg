/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { getTemplatePartIcon } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { TEMPLATE_PART_AREA_TO_NAME } from '../../../store/constants';

function TemplateAreaItem( { area, clientId } ) {
	const { selectBlock, toggleBlockHighlight } = useDispatch(
		blockEditorStore
	);
	const highlightBlock = () => toggleBlockHighlight( clientId, true );
	const cancelHighlightBlock = () => toggleBlockHighlight( clientId, false );

	return (
		<Button
			className="edit-site-template-card__template-areas-item"
			icon={ getTemplatePartIcon( area ) }
			onMouseOver={ highlightBlock }
			onMouseLeave={ cancelHighlightBlock }
			onFocus={ highlightBlock }
			onBlur={ cancelHighlightBlock }
			onClick={ () => {
				selectBlock( clientId );
			} }
		>
			{ TEMPLATE_PART_AREA_TO_NAME[ area ] }
		</Button>
	);
}

export default function TemplateAreas() {
	const templateAreaBlocks = useSelect(
		( select ) => select( editSiteStore ).getTemplateAreaBlocks(),
		[]
	);

	return (
		<section className="edit-site-template-card__template-areas">
			<Heading
				level={ 3 }
				className="edit-site-template-card__template-areas-title"
			>
				{ __( 'Areas' ) }
			</Heading>

			<ul className="edit-site-template-card__template-areas-list">
				{ Object.entries( templateAreaBlocks ).map(
					( [ area, templateAreaBlock ] ) => (
						<li key={ area }>
							<TemplateAreaItem
								area={ area }
								clientId={ templateAreaBlock.clientId }
							/>
						</li>
					)
				) }
			</ul>
		</section>
	);
}
