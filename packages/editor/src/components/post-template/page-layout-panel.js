/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	useCurrentTemplateSlug,
	useEditedPostContext,
	usePageLayoutTemplates,
} from './hooks';

function getTemplateTitle( template ) {
	if ( typeof template.title === 'string' ) {
		return decodeEntities( template.title );
	}
	return decodeEntities(
		template.title?.rendered || template.title?.raw || template.slug
	);
}

function PageLayoutPreview( { template } ) {
	const blocks = useMemo(
		() => parse( template.content?.raw || '' ),
		[ template.content?.raw ]
	);

	if ( ! blocks.length ) {
		return <div className="editor-page-layout-panel__empty-preview" />;
	}

	return (
		<BlockPreview.Async>
			<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
		</BlockPreview.Async>
	);
}

export default function PageLayoutPanel() {
	const { postType, postId } = useEditedPostContext();
	const layouts = usePageLayoutTemplates();
	const currentTemplateSlug = useCurrentTemplateSlug();
	const currentValue = currentTemplateSlug || '';
	const { editEntityRecord } = useDispatch( coreStore );

	const updateLayout = useCallback(
		( layout ) => {
			if ( layout.layoutValue === currentValue ) {
				return;
			}

			editEntityRecord(
				'postType',
				postType,
				postId,
				{
					template: layout.isDefault ? '' : layout.slug,
				},
				{ undoIgnore: true }
			);
		},
		[ currentValue, editEntityRecord, postId, postType ]
	);

	if ( postType !== 'page' || ! layouts.length ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Page Layout' ) } initialOpen>
			<div className="editor-page-layout-panel">
				<div
					role="radiogroup"
					aria-label={ __( 'Page layouts' ) }
					className="editor-page-layout-panel__options"
				>
					{ layouts.map( ( layout ) => {
						const isCurrent = layout.layoutValue === currentValue;
						const inputId = `editor-page-layout-${
							layout.id || layout.slug || 'default'
						}`;

						return (
							<label
								htmlFor={ inputId }
								key={ layout.id || layout.slug }
								className={ clsx(
									'editor-page-layout-panel__option',
									{
										'is-selected': isCurrent,
									}
								) }
							>
								<input
									id={ inputId }
									type="radio"
									name="editor-page-layout"
									value={ layout.layoutValue }
									checked={ isCurrent }
									onChange={ () => updateLayout( layout ) }
								/>
								<div className="editor-page-layout-panel__preview">
									<PageLayoutPreview template={ layout } />
								</div>
								<div className="editor-page-layout-panel__label">
									<span>{ getTemplateTitle( layout ) }</span>
									{ isCurrent && (
										<span className="editor-page-layout-panel__current-badge">
											{ __( 'Current' ) }
										</span>
									) }
								</div>
							</label>
						);
					} ) }
				</div>
			</div>
		</PanelBody>
	);
}
