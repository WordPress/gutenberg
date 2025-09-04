/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

function ButtonBlockAppender(
	{ rootClientId, className, onFocus, tabIndex, onSelect },
	ref
) {
	return (
		<Inserter
			position="bottom center"
			rootClientId={ rootClientId }
			__experimentalIsQuick
			onSelectOrClose={ ( ...args ) => {
				if ( onSelect && typeof onSelect === 'function' ) {
					onSelect( ...args );
				}
			} }
			renderToggle={ ( {
				onToggle,
				disabled,
				isOpen,
				blockTitle,
				hasSingleBlockType,
				defaultBlock,
				defaultBlockType,
			} ) => {
				const isToggleButton = ! hasSingleBlockType;

				// Get appender label from block's __experimentalLabel function
				const appenderLabel =
					defaultBlock &&
					defaultBlock.attributes &&
					defaultBlockType?.__experimentalLabel
						? ( () => {
								const result =
									defaultBlockType.__experimentalLabel(
										defaultBlock.attributes,
										{ context: 'appender' }
									);
								// Only use if it's a string and not too long (safety check)
								return typeof result === 'string' &&
									result.length < 50
									? result.toLowerCase()
									: null;
						  } )()
						: null;

				let label;
				if ( hasSingleBlockType ) {
					label = sprintf(
						// translators: %s: the name of the block when there is only one
						_x( 'Add %s', 'directly add the only allowed block' ),
						blockTitle.toLowerCase()
					);
				} else if ( appenderLabel ) {
					label = sprintf(
						// translators: %s: the appender label for the default block
						_x( 'Add %s', 'add default block type' ),
						appenderLabel
					);
				} else {
					label = _x(
						'Add block',
						'Generic label for block inserter button'
					);
				}

				return (
					<Button
						__next40pxDefaultSize
						ref={ ref }
						onFocus={ onFocus }
						tabIndex={ tabIndex }
						className={ clsx(
							className,
							'block-editor-button-block-appender'
						) }
						onClick={ onToggle }
						aria-haspopup={ isToggleButton ? 'true' : undefined }
						aria-expanded={ isToggleButton ? isOpen : undefined }
						// Disable reason: There shouldn't be a case where this button is disabled but not visually hidden.
						// eslint-disable-next-line no-restricted-syntax
						disabled={ disabled }
						label={ label }
						showTooltip
					>
						<Icon icon={ plus } />
					</Button>
				);
			} }
			isAppender
		/>
	);
}

/**
 * Use `ButtonBlockAppender` instead.
 *
 * @deprecated
 */
export const ButtonBlockerAppender = forwardRef( ( props, ref ) => {
	deprecated( `wp.blockEditor.ButtonBlockerAppender`, {
		alternative: 'wp.blockEditor.ButtonBlockAppender',
		since: '5.9',
	} );

	return ButtonBlockAppender( props, ref );
} );

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/button-block-appender/README.md
 */
export default forwardRef( ButtonBlockAppender );
