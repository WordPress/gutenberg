/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

function ButtonBlockAppender(
	{ rootClientId, className, onFocus, tabIndex, __experimentalButtonText },
	ref
) {
	return (
		<Inserter
			position="bottom center"
			rootClientId={ rootClientId }
			__experimentalIsQuick
			renderToggle={ ( {
				onToggle,
				disabled,
				isOpen,
				blockTitle,
				hasSingleBlockType,
				hasBlockVariations,
			} ) => {
				let label;
				if ( hasSingleBlockType || hasBlockVariations ) {
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

				return (
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
						label={ __experimentalButtonText ? undefined : label }
						tooltipPosition="bottom"
						showTooltip={ ! __experimentalButtonText }
					>
						{ ! hasSingleBlockType &&
							! __experimentalButtonText && (
								<VisuallyHidden as="span">
									{ label }
								</VisuallyHidden>
							) }
						<Icon icon={ plus } />
						<span>{ __experimentalButtonText }</span>
					</Button>
				);
			} }
			isAppender
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/button-block-appender/README.md
 */
export default forwardRef( ButtonBlockAppender );
