import type {
	ComponentProps,
	ComponentType,
	ForwardedRef,
	RefAttributes,
} from 'react';
import type { Block } from '@wordpress/blocks';
import clsx from 'clsx';
import { Button } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';
import UntypedInserter from '../inserter';
import type { ButtonBlockAppenderProps } from './types';
import type { InserterToggleRenderProps } from '../inserter/types';

// The inserter is still JavaScript, so its inferred props are all required.
type TypedInserter = ComponentType<
	Partial< ComponentProps< typeof UntypedInserter > > &
		RefAttributes< unknown >
>;

function ButtonBlockAppender(
	{
		rootClientId,
		className,
		onFocus,
		tabIndex,
		onSelect,
	}: ButtonBlockAppenderProps,
	ref: ForwardedRef< HTMLButtonElement >
) {
	// Read on render, like the JSX it replaces, as the imports are circular.
	const Inserter = UntypedInserter as TypedInserter;
	return (
		<Inserter
			position="bottom center"
			rootClientId={ rootClientId }
			__experimentalIsQuick
			onSelectOrClose={ ( ...args: [ Block? ] ) => {
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
				appenderLabel,
			}: InserterToggleRenderProps ) => {
				const isToggleButton = ! hasSingleBlockType;

				let label;
				if ( appenderLabel ) {
					// Block returns the full label; use directly (consistent with getBlockLabel).
					label = appenderLabel;
				} else if ( hasSingleBlockType ) {
					label = sprintf(
						// translators: %s: the name of the block when there is only one
						_x( 'Add %s', 'directly add the only allowed block' ),
						blockTitle.toLowerCase()
					);
				} else {
					label = _x(
						'Add block',
						'Generic label for block inserter button'
					);
				}

				return (
					// Disable reason: There shouldn't be a case where this button is disabled but not visually hidden.
					// eslint-disable-next-line @wordpress/components-no-unsafe-button-disabled
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
export const ButtonBlockerAppender = forwardRef<
	HTMLButtonElement,
	ButtonBlockAppenderProps
>( ( props, ref ) => {
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
