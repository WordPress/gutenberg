/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Tooltip, VisuallyHidden } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

function ButtonBlockAppender(
	{
		rootClientId,
		className,
		__experimentalSelectBlockOnInsert: selectBlockOnInsert,
		onFocus,
		tabIndex,
	},
	ref
) {
	return (
		<Inserter
			position="bottom center"
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
					label = sprintf(
						// translators: %s: the name of the block when there is only one
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

				let inserterButton = (
					<Button
						ref={ ref }
						onFocus={ onFocus }
						tabIndex={ tabIndex }
						className={ classnames(
							className,
							'block-editor-button-block-appender'
						) }
						onClick={ onToggle }
						aria-haspopup={ isToggleButton ? 'true' : undefined }
						aria-expanded={ isToggleButton ? isOpen : undefined }
						disabled={ disabled }
						label={ label }
					>
						{ ! hasSingleBlockType && (
							<VisuallyHidden as="span">{ label }</VisuallyHidden>
						) }
						<Icon icon={ plus } />
					</Button>
				);

				if ( isToggleButton || hasSingleBlockType ) {
					inserterButton = (
						<Tooltip text={ label }>{ inserterButton }</Tooltip>
					);
				}
				return inserterButton;
			} }
			isAppender
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/button-block-appender/README.md
 */
export default forwardRef( ButtonBlockAppender );
