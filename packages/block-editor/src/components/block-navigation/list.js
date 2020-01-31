/**
 * External dependencies
 */
import { isNil, map, omitBy } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import ButtonBlockAppender from '../button-block-appender';

export default function BlockNavigationList( {
	blocks,
	selectedBlockClientId,
	selectBlock,
	showAppender,

	// Internal use only.
	showNestedBlocks,
	parentBlockClientId,
} ) {
	const shouldShowAppender = showAppender && !! parentBlockClientId;

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul className="block-editor-block-navigation__list" role="list">
			{ map( omitBy( blocks, isNil ), ( block ) => {
				const blockType = getBlockType( block.name );
				const isSelected = block.clientId === selectedBlockClientId;

				return (
					<li key={ block.clientId }>
						<div className="block-editor-block-navigation__item">
							<Button
								className={ classnames(
									'block-editor-block-navigation__item-button',
									{
										'is-selected': isSelected,
									}
								) }
								onClick={ () => selectBlock( block.clientId ) }
							>
								<BlockIcon icon={ blockType.icon } showColors />
								{ getBlockLabel( blockType, block.attributes ) }
								{ isSelected && (
									<span className="screen-reader-text">
										{ __( '(selected block)' ) }
									</span>
								) }
							</Button>
						</div>
						{ showNestedBlocks &&
							!! block.innerBlocks &&
							!! block.innerBlocks.length && (
								<BlockNavigationList
									blocks={ block.innerBlocks }
									selectedBlockClientId={
										selectedBlockClientId
									}
									selectBlock={ selectBlock }
									parentBlockClientId={ block.clientId }
									showAppender={ showAppender }
									showNestedBlocks
								/>
							) }
					</li>
				);
			} ) }
			{ shouldShowAppender && (
				<li>
					<div className="block-editor-block-navigation__item">
						<ButtonBlockAppender
							rootClientId={ parentBlockClientId }
							__experimentalSelectBlockOnInsert={ false }
						/>
					</div>
				</li>
			) }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}
