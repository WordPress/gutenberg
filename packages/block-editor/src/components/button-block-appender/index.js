/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { _x, sprintf } from '@wordpress/i18n';
import { Icon, plusCircle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

function ButtonBlockAppender( {
	rootClientId,
	className,
	__experimentalSelectBlockOnInsert: selectBlockOnInsert,
} ) {
	return (
		<Inserter
			rootClientId={ rootClientId }
			__experimentalSelectBlockOnInsert={ selectBlockOnInsert }
			renderToggle={ ( {
				onToggle,
				disabled,
				isOpen,
				blockTitle,
				hasSingleBlockType,
			} ) => {
				let label;
				if ( hasSingleBlockType ) {
					// translators: %s: the name of the block when there is only one
					label = sprintf(
						_x( 'Add %s', 'directly add the only allowed block' ),
						blockTitle
					);
				} else {
					label = _x(
						'Add block',
						'Generic label for block inserter button'
					);
				}
				const isToggleButton = ! hasSingleBlockType;
				return (
					<Tooltip text={ label }>
						<Button
							className={ classnames(
								className,
								'block-editor-button-block-appender'
							) }
							onClick={ onToggle }
							aria-haspopup={
								isToggleButton ? 'true' : undefined
							}
							aria-expanded={
								isToggleButton ? isOpen : undefined
							}
							disabled={ disabled }
							label={ label }
						>
							<span className="screen-reader-text">
								{ label }
							</span>
							<Icon icon={ plusCircle } />
						</Button>
					</Tooltip>
				);
			} }
			isAppender
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/button-block-appender/README.md
 */
export default ButtonBlockAppender;
