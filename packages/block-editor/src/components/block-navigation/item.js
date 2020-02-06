/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import {
	getBlockType,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import ButtonBlockAppender from '../button-block-appender';

export default function BlockNavigationItem( { block, isSelected, onClick, children } ) {
	const { clientId, name } = block;
	const blockIcon = getBlockType( name ).icon;
	const blockLabel = useSelect(
		( select ) => select( 'core/block-editor' ).getBlockLabel( clientId ),
		[ clientId ]
	);

	return (
		<li>
			<div className="block-editor-block-navigation-item__block">
				<Button
					className={ classnames( 'block-editor-block-navigation-item__button', {
						'is-selected': isSelected,
					} ) }
					onClick={ onClick }
				>
					<BlockIcon icon={ blockIcon } showColors />
					{ blockLabel }
					{ isSelected && <span className="screen-reader-text">{ __( '(selected block)' ) }</span> }
				</Button>
			</div>
			{ children }
		</li>
	);
}

BlockNavigationItem.Appender = function( { parentBlockClientId } ) {
	return (
		<li>
			<div className="block-editor-block-navigation-item__appender">
				<ButtonBlockAppender
					rootClientId={ parentBlockClientId }
					__experimentalSelectBlockOnInsert={ false }
				/>
			</div>
		</li>
	);
};
