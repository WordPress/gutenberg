/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RichText from '../rich-text/';

const BlockCaption = ( {
	isSelected,
	onChange,
	placeholder = __( 'Add caption' ),
	ariaLabel = __( 'Caption text' ),
	ref,
	caption,
	tagName = 'figcaption',
	className,
	onFocusCaption,
	insertBlocksAfter = () => {},
	unstableOnFocus,
	inlineToolbar,
	containerRef,
	...richTextProps
} ) => {
	const onMergeCaption = () => {
		// If caption is empty, we set focus to the block so that backspacing selects
		// the parent block and the caret is not stuck inside the caption input.
		if ( ! caption ) {
			containerRef.current.focus();
		}
	};

	return (
		<RichText
			ref={ ref }
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
			inlineToolbar={ inlineToolbar }
			{ ...richTextProps }
		/>
	);
};

export default BlockCaption;
