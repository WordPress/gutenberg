/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { Button, FormTokenField } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { normalizeCSSClassName } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { store as blockEditorStore } from '../store';

/**
 * Filters registered block settings, extending attributes to include `className`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'customClassName', true ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			className: {
				type: 'string',
			},
		};
	}

	return settings;
}

function getClassNameTokens( className = '' ) {
	return className.split( /\s+/ ).filter( Boolean );
}

function getClassNameTokenValue( token ) {
	return typeof token === 'string' ? token : token.value;
}

function normalizeClassNameTokens( classNames ) {
	return classNames
		.flatMap( ( className ) =>
			String( getClassNameTokenValue( className ) )
				.split( /\s+/ )
				.map( normalizeCSSClassName )
		)
		.filter( Boolean )
		.filter(
			( className, index, classNameList ) =>
				classNameList.indexOf( className ) === index
		);
}

function getBlockTreeClassNames( blocks = [] ) {
	return normalizeClassNameTokens(
		blocks.flatMap( ( block ) => [
			block.attributes?.className ?? '',
			...getBlockTreeClassNames( block.innerBlocks ),
		] )
	);
}

function getClassNamesDifference( classNames, excludedClassNames ) {
	const excluded = new Set( excludedClassNames );
	return classNames.filter(
		( nextClassName ) => ! excluded.has( nextClassName )
	);
}

function ClassNameBrowserGroup( { title, classNames, onSelect } ) {
	if ( ! classNames.length ) {
		return null;
	}

	return (
		<div className="block-editor-hooks__custom-class-name-group">
			<strong>{ title }</strong>
			<div className="block-editor-hooks__custom-class-name-list">
				{ classNames.map( ( nextClassName ) => (
					<Button
						key={ nextClassName }
						__next40pxDefaultSize
						size="compact"
						variant="tertiary"
						onClick={ () => onSelect( nextClassName ) }
					>
						{ `.${ nextClassName }` }
					</Button>
				) ) }
			</div>
		</div>
	);
}

function CustomClassNameControlsPure( { className, setAttributes } ) {
	const blockEditingMode = useBlockEditingMode();
	const [ isClassBrowserOpen, setIsClassBrowserOpen ] = useState( false );
	const { currentDocumentCssClasses, managedCssClasses, siteCssClasses } =
		useSelect( ( select ) => {
			const { getBlocks, getSettings } = select( blockEditorStore );
			const settings = getSettings();

			return {
				currentDocumentCssClasses: getBlockTreeClassNames(
					getBlocks()
				),
				managedCssClasses:
					settings.__experimentalManagedCssClasses ?? [],
				siteCssClasses: settings.__experimentalSiteCssClasses ?? [],
			};
		}, [] );
	const currentTokens = useMemo(
		() => getClassNameTokens( className ),
		[ className ]
	);
	const suggestions = useMemo(
		() => normalizeClassNameTokens( managedCssClasses ),
		[ managedCssClasses ]
	);
	const currentDocumentSuggestions = useMemo(
		() =>
			getClassNamesDifference( currentDocumentCssClasses, currentTokens ),
		[ currentDocumentCssClasses, currentTokens ]
	);
	const siteSuggestions = useMemo(
		() =>
			getClassNamesDifference( siteCssClasses, [
				...currentTokens,
				...currentDocumentCssClasses,
			] ),
		[ currentDocumentCssClasses, currentTokens, siteCssClasses ]
	);

	function setClassNames( nextClassNames ) {
		const classNames = normalizeClassNameTokens( nextClassNames );
		setAttributes( {
			className: classNames.length ? classNames.join( ' ' ) : undefined,
		} );
	}

	function addClassName( nextClassName ) {
		setClassNames( [ ...currentTokens, nextClassName ] );
	}

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	return (
		<InspectorControls group="advanced">
			<FormTokenField
				__next40pxDefaultSize
				label={ __( 'Additional CSS class(es)' ) }
				value={ currentTokens }
				suggestions={ suggestions }
				tokenizeOnSpace
				onChange={ setClassNames }
				help={ __( 'Separate multiple classes with spaces.' ) }
			/>
			<Button
				__next40pxDefaultSize
				variant="tertiary"
				onClick={ () =>
					setIsClassBrowserOpen( ( isOpen ) => ! isOpen )
				}
				aria-expanded={ isClassBrowserOpen }
			>
				{ __( 'Browse existing classes' ) }
			</Button>
			{ isClassBrowserOpen && (
				<div className="block-editor-hooks__custom-class-name-browser">
					<ClassNameBrowserGroup
						title={ __( 'Managed classes' ) }
						classNames={ getClassNamesDifference(
							suggestions,
							currentTokens
						) }
						onSelect={ addClassName }
					/>
					<ClassNameBrowserGroup
						title={ __( 'Used in this document' ) }
						classNames={ currentDocumentSuggestions }
						onSelect={ addClassName }
					/>
					<ClassNameBrowserGroup
						title={ __( 'Used elsewhere on this site' ) }
						classNames={ siteSuggestions }
						onSelect={ addClassName }
					/>
				</div>
			) }
		</InspectorControls>
	);
}

export default {
	edit: CustomClassNameControlsPure,
	addSaveProps,
	attributeKeys: [ 'className' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'customClassName', true );
	},
};

/**
 * Override props assigned to save component to inject the className, if block
 * supports customClassName. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if (
		hasBlockSupport( blockType, 'customClassName', true ) &&
		attributes.className
	) {
		extraProps.className = clsx(
			extraProps.className,
			attributes.className
		);
	}

	return extraProps;
}

export function addTransforms( result, source, index, results ) {
	if ( ! hasBlockSupport( result.name, 'customClassName', true ) ) {
		return result;
	}

	// If the condition verifies we are probably in the presence of a wrapping transform
	// e.g: nesting paragraphs in a group or columns and in that case the class should not be kept.
	if ( results.length === 1 && result.innerBlocks.length === source.length ) {
		return result;
	}

	// If we are transforming one block to multiple blocks or multiple blocks to one block,
	// we ignore the class during the transform.
	if (
		( results.length === 1 && source.length > 1 ) ||
		( results.length > 1 && source.length === 1 )
	) {
		return result;
	}

	// If we are in presence of transform between one or more block in the source
	// that have one or more blocks in the result
	// we apply the class on source N to the result N,
	// if source N does not exists we do nothing.
	if ( source[ index ] ) {
		const originClassName = source[ index ]?.attributes.className;
		// Avoid overriding classes if the transformed block already includes them.
		if ( originClassName && result.attributes.className === undefined ) {
			return {
				...result,
				attributes: {
					...result.attributes,
					className: originClassName,
				},
			};
		}
	}
	return result;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-class-name/attribute',
	addAttribute
);

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/customClassName/addTransforms',
	addTransforms
);
