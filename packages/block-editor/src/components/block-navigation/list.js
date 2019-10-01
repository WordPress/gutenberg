/**
 * External dependencies
 */
import { map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

export default function BlockNavigationList( {
	blocks,
	selectedBlockClientId,
	selectBlock,
	showNestedBlocks,
} ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul className="editor-block-navigation__list block-editor-block-navigation__list" role="list">
			{ map( blocks, ( block ) => {
				const blockType = getBlockType( block.name );
				const isSelected = block.clientId === selectedBlockClientId;

				return (
					<li key={ block.clientId }>
						<div className="editor-block-navigation__item block-editor-block-navigation__item">
							<Button
								className={ classnames( 'editor-block-navigation__item-button block-editor-block-navigation__item-button', {
									'is-selected': isSelected,
								} ) }
								onClick={ () => selectBlock( block.clientId ) }
							>
								<BlockIcon icon={ blockType.icon } showColors />
								{ blockType.title }
								{ isSelected && <span className="screen-reader-text">{ __( '(selected block)' ) }</span> }
							</Button>
						</div>
						{ showNestedBlocks && !! block.innerBlocks && !! block.innerBlocks.length && (
							<BlockNavigationList
								blocks={ block.innerBlocks }
								selectedBlockClientId={ selectedBlockClientId }
								selectBlock={ selectBlock }
								showNestedBlocks
							/>
						) }
					</li>
				);
			} ) }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}
