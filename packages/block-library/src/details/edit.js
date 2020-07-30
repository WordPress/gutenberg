/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

export default ( {
	attributes,
	className,
	clientId,
	isSelected,
	setAttributes,
} ) => {
	const innerBlockSelected = useSelect(
		( select ) =>
			select( 'core/block-editor' ).hasSelectedInnerBlock( clientId ),
		[ clientId ]
	);

	const showInnerBlocks = isSelected || innerBlockSelected;

	const classes = classnames(
		{
			'is-open': showInnerBlocks,
		},
		className
	);

	/* You may be wondering why we don't just use a <details> element here.
	 * The problem we are trying to solve is that a <summary> is basically a
	 * button, and when it has focus, it eats the space key.
	 *
	 * That's a problem if you want to use a <RichText> component inside your
	 * <summary>. Each time you press space, it toggles the rest of the
	 * <details>, and it doesn't even add a space to your <RichText>.
	 *
	 * Then there's the fact that the space exists for a11y reasons. If you
	 * catch the event and preventDefault() then you've remove the way for
	 * keyboard users to toggle the <details>.
	 */
	return (
		<>
			<div className={ classes }>
				<RichText
					tagName="div"
					className="block-library-details__pseudo-summary"
					value={ attributes.content }
					onChange={ ( content ) => setAttributes( { content } ) }
					placeholder={ __( 'Visible Content' ) }
				/>
				{ showInnerBlocks && <InnerBlocks /> }
			</div>
		</>
	);
};
