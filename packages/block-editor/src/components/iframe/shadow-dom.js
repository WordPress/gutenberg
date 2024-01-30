/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, createPortal, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMergeRefs, useRefEffect, useDisabled } from '@wordpress/compose';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function Iframe( {
	contentRef,
	children,
	tabIndex = 0,
	scale = 1,
	readonly,
	forwardedRef: ref,
	...props
} ) {
	const { resolvedAssets, isPreviewMode } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			resolvedAssets: settings.__unstableResolvedAssets,
			isPreviewMode: settings.__unstableIsPreviewMode,
		};
	}, [] );
	const { styles = '' } = resolvedAssets;
	const [ shadow, setShadow ] = useState();
	const [ bodyClasses, setBodyClasses ] = useState( [] );
	const setRef = useRefEffect( ( node ) => {
		const _shadow = node.attachShadow( { mode: 'open' } );
		const html = document.createElement( 'html' );
		_shadow.appendChild( html );
		setShadow( _shadow );
		// Ideally ALL classes that are added through get_body_class should
		// be added in the editor too, which we'll somehow have to get from
		// the server in the future (which will run the PHP filters).
		setBodyClasses(
			Array.from( node.ownerDocument.body.classList ).filter(
				( name ) =>
					name.startsWith( 'admin-color-' ) ||
					name.startsWith( 'post-type-' ) ||
					name === 'wp-embed-responsive'
			)
		);
	}, [] );

	const disabledRef = useDisabled( { isDisabled: ! readonly } );
	const bodyRef = useMergeRefs( [ contentRef, disabledRef ] );

	return (
		<>
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<div
				{ ...props }
				style={ {
					border: 0,
					...props.style,
					transform:
						scale !== 1
							? `scale( ${ scale } )`
							: props.style?.transform,
					transition: 'all .3s',
				} }
				ref={ useMergeRefs( [ ref, setRef ] ) }
				tabIndex={ tabIndex }
				title={ __( 'Editor canvas' ) }
			>
				{ shadow &&
					createPortal(
						<body
							ref={ bodyRef }
							className={ classnames(
								'block-editor-iframe__body',
								'editor-styles-wrapper',
								...bodyClasses
							) }
						>
							<div
								dangerouslySetInnerHTML={ {
									__html: styles,
								} }
							></div>
							<StyleProvider document={ shadow }>
								{ children }
							</StyleProvider>
						</body>,
						shadow.firstElementChild
					) }
			</div>
		</>
	);
}

function IframeIfReady( props, ref ) {
	const isInitialised = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__internalIsInitialized,
		[]
	);

	// We shouldn't render the iframe until the editor settings are initialised.
	// The initial settings are needed to get the styles for the srcDoc, which
	// cannot be changed after the iframe is mounted. srcDoc is used to to set
	// the initial iframe HTML, which is required to avoid a flash of unstyled
	// content.
	if ( ! isInitialised ) {
		return null;
	}

	return <Iframe { ...props } forwardedRef={ ref } />;
}

export default forwardRef( IframeIfReady );
