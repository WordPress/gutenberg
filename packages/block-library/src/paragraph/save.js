/**
 * 
 */

/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
    const {
        summary,
        summaryLevel,
        summaryId,
        contentId,
        showContent,
    } = attributes;

     const className = clsx( 'wp-block-details', {
        'is-open': !! showContent,
    } );

    const blockProps = useBlockProps.save( { className } );

     const TagName = summaryLevel ? summaryLevel : 'span';

    return (
        <div { ...blockProps }>
            <details open={ !! showContent }>
                <summary id={ summaryId } aria-controls={ contentId }>
                    <RichText.Content
                        tagName={ TagName }
                        className={ summaryLevel ? 'wp-block-details-summary-heading' : undefined }
                        value={ summary }
                    />
                </summary>

                <div id={ contentId } role="region" aria-labelledby={ summaryId }>
                    <InnerBlocks.Content />
                </div>
            </details>
        </div>
    );
}

