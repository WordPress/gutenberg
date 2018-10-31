/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockType, getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { ExternalLink, PanelBody } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockIcon from '../block-icon';
import InspectorControls from '../inspector-controls';
import InspectorAdvancedControls from '../inspector-advanced-controls';
import BlockStyles from '../block-styles';

const BlockInspector = ( { selectedBlock, blockType, count } ) => {
	if ( count > 1 ) {
		return <span className="editor-block-inspector__multi-blocks">{ __( 'Coming Soon' ) }</span>;
	}

	const isSelectedBlockUnregistered =
		!! selectedBlock && selectedBlock.name === getUnregisteredTypeHandlerName();

	/*
	 * If the selected block is of an unregistered type, avoid showing it as an actual selection
	 * because we want the user to focus on the unregistered block warning, not block settings.
	 */
	if ( ! selectedBlock || isSelectedBlockUnregistered ) {
		return <span className="editor-block-inspector__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	const hasSupportLink = blockType.support && blockType.support.url && blockType.support.label;

	return (
		<Fragment>
			<div className="editor-block-inspector__card">
				<BlockIcon icon={ blockType.icon } showColors />
				<div className="editor-block-inspector__card-content">
					<div className="editor-block-inspector__card-title">{ blockType.title }</div>
					<div className="editor-block-inspector__card-description">{ blockType.description }</div>
					{ hasSupportLink && (
						<div className="editor-block-inspector__card-support">
							{
								blockType.support.external ? (
									<ExternalLink href={ blockType.support.url }>
										{ blockType.support.label }
									</ExternalLink>
								) : (
									<a href={ blockType.support.url }>
										{ blockType.support.label }
									</a>
								)
							}
						</div>
					) }
				</div>
			</div>
			{ !! blockType.styles && (
				<div>
					<PanelBody
						title={ __( 'Styles' ) }
						initialOpen={ false }
					>
						<BlockStyles
							clientId={ selectedBlock.clientId }
						/>
					</PanelBody>
				</div>
			) }
			<div><InspectorControls.Slot /></div>
			<div>
				<InspectorAdvancedControls.Slot>
					{ ( fills ) => ! isEmpty( fills ) && (
						<PanelBody
							className="editor-block-inspector__advanced"
							title={ __( 'Advanced' ) }
							initialOpen={ false }
						>
							{ fills }
						</PanelBody>
					) }
				</InspectorAdvancedControls.Slot>
			</div>
			<SkipToSelectedBlock key="back" />
		</Fragment>
	);
};

export default withSelect(
	( select ) => {
		const { getSelectedBlock, getSelectedBlockCount } = select( 'core/editor' );
		const selectedBlock = getSelectedBlock();
		const blockType = selectedBlock && getBlockType( selectedBlock.name );
		return {
			selectedBlock,
			blockType,
			count: getSelectedBlockCount(),
		};
	}
)( BlockInspector );
