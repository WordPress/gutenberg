/**
 * edit.js — Details block editor
 */

/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
    PanelBody,
    SelectControl,
} from '@wordpress/components';
import {
    BlockControls,
    InspectorControls,
    RichText,
    useBlockProps,
    InnerBlocks,
    useBlockEditingMode,
} from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {useOnEnter} from './use-enter';

const HEADING_OPTIONS = [
    { label: __( 'Plain text (no heading)', 'default' ), value: '' },
    { label: 'H1', value: 'h1' },
    { label: 'H2', value: 'h2' },
    { label: 'H3', value: 'h3' },
    { label: 'H4', value: 'h4' },
    { label: 'H5', value: 'h5' },
    { label: 'H6', value: 'h6' },
];

function DetailsEdit( {
    attributes,
    setAttributes,
    clientId,
} ) {
    const {
        summary,
        summaryLevel,
        summaryId,
        contentId,
        showContent,
        placeholder,
    } = attributes;

    const blockProps = useBlockProps( {
        ref: useOnEnter( { clientId, content: summary } ),
        className: clsx( 'wp-block-details' ),
    } );

    const blockEditingMode = useBlockEditingMode();
    const instance = useInstanceId( DetailsEdit, 'details' );

    // Generate stable ids on mount if missing
    // (no dependency array items to avoid re-run)
    if ( ( ! summaryId || ! contentId ) && typeof instance !== 'undefined' ) {
        const base = typeof instance === 'number' ? String( instance ) : String( Date.now() );
        setAttributes( {
            summaryId: summaryId || `details-summary-${ base }`,
            contentId: contentId || `details-content-${ base }`,
        } );
    }

    return (
        <>
            {blockEditingMode === 'default' && (
                <BlockControls group="block">
                    {/* you can add block-level toolbar buttons here if needed */}
                </BlockControls>
            )}

            <InspectorControls>
                <PanelBody title={ __( 'Summary heading settings', 'default' ) } initialOpen>
                    <SelectControl
                        label={ __( 'Summary heading level', 'default' ) }
                        value={ summaryLevel }
                        options={ HEADING_OPTIONS }
                        onChange={ ( v ) => setAttributes( { summaryLevel: v } ) }
                    />
                    <p style={ { marginTop: 8, color: '#666' } }>
                        { __( 'Wrap the summary text in a heading (H1–H6) for improved structure and accessibility.', 'default' ) }
                    </p>
                </PanelBody>
            </InspectorControls>

            <div { ...blockProps }>
                <details open={ !! showContent }>
                    {/* summary: render chosen heading inside summary for WYSIWYG */}
                    <summary id={ summaryId } aria-controls={ contentId }>
                        { summaryLevel ? (
                            <RichText
                                identifier="summary"
                                tagName={ summaryLevel }
                                className="wp-block-details-summary-heading"
                                value={ summary }
                                onChange={ ( value ) => setAttributes( { summary: value } ) }
                                placeholder={ placeholder || __( 'Summary text…', 'default' ) }
                            />
                        ) : (
                            <RichText
                                identifier="summary"
                                tagName="span"
                                value={ summary }
                                onChange={ ( value ) => setAttributes( { summary: value } ) }
                                placeholder={ placeholder || __( 'Summary text…', 'default' ) }
                            />
                        ) }
                    </summary>

                    <div id={ contentId } role="region" aria-labelledby={ summaryId } style={ { paddingLeft: '1rem' } }>
                        <InnerBlocks />
                    </div>
                </details>
            </div>
        </>
    );
}

export default DetailsEdit;
