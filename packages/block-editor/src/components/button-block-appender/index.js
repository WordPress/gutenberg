/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Icon, Tooltip } from '@wordpress/components';
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockDropZone from '../block-drop-zone';
import Inserter from '../inserter';

function ButtonBlockAppender( { rootClientId, className } ) {
	return (
		<>
			<BlockDropZone rootClientId={ rootClientId } />
			<Inserter
				rootClientId={ rootClientId }
				renderToggle={ ( { onToggle, disabled, isOpen, blockTitle, hasOnlyOneAllowedInserterBlockType } ) => {
					const label = blockTitle === '' ? _x( 'Add block', 'Generic label for block inserter button' ) : sprintf( _x( 'Add %s', 'directly add the only allowed block' ), blockTitle );
					return (
						<Tooltip text={ label }>
							<Button
								className={ classnames( className, 'block-editor-button-block-appender' ) }
								onClick={ onToggle }
								aria-haspopup={ ! hasOnlyOneAllowedInserterBlockType ? 'true' : false }
								aria-expanded={ ! hasOnlyOneAllowedInserterBlockType ? isOpen : false }
								disabled={ disabled }
								label={ label }
							>
								<span className="screen-reader-text">{ label }</span>
								<Icon icon="insert" />
							</Button>
						</Tooltip>
					);
				} }
				isAppender
			/>
		</>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/button-block-appender/README.md
 */
export default ButtonBlockAppender;
