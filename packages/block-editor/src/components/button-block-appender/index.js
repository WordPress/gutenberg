/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button, Tooltip, VisuallyHidden } from '@wordpress/components';
import { forwardRef, useRef } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { useMergeRefs } from '@wordpress/compose';

function ButtonBlockAppender(
	{ rootClientId, className, onFocus, tabIndex, onSelect },
	ref
) {
	const inserterButtonRef = useRef();

	const mergedInserterButtonRef = useMergeRefs( [ inserterButtonRef, ref ] );
	return (
		<Inserter
			position="bottom center"
			rootClientId={ rootClientId }
			__experimentalIsQuick
			onSelectOrClose={ ( ...args ) => {
				if ( onSelect && typeof onSelect === 'function' ) {
					onSelect( ...args );
				}
				inserterButtonRef.current?.focus();
			} }
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
						// TODO: Switch to `true` (40px size) if possible
						__next40pxDefaultSize={ false }
						ref={ mergedInserterButtonRef }
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
