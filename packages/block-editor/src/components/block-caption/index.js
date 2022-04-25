/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RichText from '../rich-text/';

// eslint-disable-next-line jsdoc/require-param
/**
 * Block caption component which is a thin wrapper around the RichText component
 * that can be used to render captions for blocks like image block, video block,
 * table block, embed block, gallery block e.t.c
 *
 * @param {Object} props Component props.
 * @return {WPElement} Block Caption.
 */

const BlockCaption = ( {
	isSelected,
	onChange,
	placeholder = __( 'Add caption' ),
	ariaLabel = __( 'Caption text' ),
	captionRef,
	caption,
	tagName = 'figcaption',
	className,
	onFocusCaption,
	insertBlocksAfter = () => {},
	unstableOnFocus,
	containerRef,
	...richTextProps
} ) => {
	const onMergeCaption = () => {
		// If caption is empty, we set focus to the block so that backspacing selects
		// the parent block and the caret is not stuck inside the caption input.
		if ( ! caption ) {
			containerRef.current?.focus();
		}
	};

	return (
		<RichText
			ref={ captionRef }
			tagName={ tagName }
			aria-label={ ariaLabel }
			placeholder={ placeholder }
			value={ caption }
			onChange={ onChange }
			__unstableOnSplitAtEnd={ insertBlocksAfter }
			onMerge={ onMergeCaption }
			className={ className }
			isSelected={ isSelected }
			onClick={ onFocusCaption }
			unstableOnFocus={ unstableOnFocus }
			{ ...richTextProps }
		/>
	);
};

export default BlockCaption;
