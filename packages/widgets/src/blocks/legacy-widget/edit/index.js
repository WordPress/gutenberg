/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	BlockControls,
	InspectorControls,
	BlockIcon,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Spinner, Placeholder } from '@wordpress/components';
import { brush as brushIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import WidgetTypeSelector from './widget-type-selector';
import InspectorCard from './inspector-card';
import Form from './form';
import Preview from './preview';
import NoPreview from './no-preview';
import ConvertToBlocksButton from './convert-to-blocks-button';

export default function Edit( props ) {
	const { id, idBase } = props.attributes;

	const [ isEditing, setIsEditing ] = useState( false );
	const stopEditing = useCallback( () => {
		setIsEditing( false );
		ref.current.focus();
	}, [ setIsEditing ] );

	// wide display of widgets applies only at breakpoints greater than small
	const canWideFit = useViewportMatch( 'small' );
	const isWide = props.isWide && canWideFit;

	const ref = useRef();

	useEffect( () => setIsEditing( props.isSelected ), [ props.isSelected ] );

	const blockProps = useBlockProps( {
		ref,
		className: classnames( {
			'is-wide-widget': isWide,
		} ),
	} );

	if ( isWide ) {
		blockProps.onClick = ( { currentTarget, target } ) => {
			if ( currentTarget.contains( target ) ) {
				setIsEditing( true );
			}
		};
	}

	return (
		<div { ...blockProps }>
			{ ! id && ! idBase ? (
				<Empty { ...props } />
			) : (
				<NotEmpty { ...{ ...props, isWide, isEditing, stopEditing } } />
			) }
		</div>
	);
}

function Empty( { attributes: { id, idBase }, setAttributes } ) {
	return (
		<Placeholder
			icon={ <BlockIcon icon={ brushIcon } /> }
			label={ __( 'Legacy Widget' ) }
		>
			<WidgetTypeSelector
				selectedId={ id ?? idBase }
				onSelect={ ( { selectedId, isMulti } ) => {
					if ( ! selectedId ) {
						setAttributes( {
							id: null,
							idBase: null,
							instance: null,
						} );
					} else if ( isMulti ) {
						setAttributes( {
							id: null,
							idBase: selectedId,
							instance: {},
						} );
					} else {
						setAttributes( {
							id: selectedId,
							idBase: null,
							instance: null,
						} );
					}
				} }
			/>
		</Placeholder>
	);
}

function NotEmpty( {
	attributes: { id, idBase, instance },
	setAttributes,
	clientId,
	isWide = false,
	isEditing,
	stopEditing,
} ) {
	const [ hasPreview, setHasPreview ] = useState( null );

	const { widgetType, hasResolvedWidgetType, isNavigationMode } = useSelect(
		( select ) => {
			const widgetTypeId = id ?? idBase;
			return {
				widgetType: select( coreStore ).getWidgetType( widgetTypeId ),
				hasResolvedWidgetType: select(
					coreStore
				).hasFinishedResolution( 'getWidgetType', [ widgetTypeId ] ),
				isNavigationMode: select( blockEditorStore ).isNavigationMode(),
			};
		},
		[ id, idBase ]
	);

	const setInstance = useCallback( ( nextInstance ) => {
		setAttributes( { instance: nextInstance } );
	}, [] );

	if ( ! widgetType && hasResolvedWidgetType ) {
		return (
			<Placeholder
				icon={ <BlockIcon icon={ brushIcon } /> }
				label={ __( 'Legacy Widget' ) }
			>
				{ __( 'Widget is missing.' ) }
			</Placeholder>
		);
	}

	if ( ! hasResolvedWidgetType ) {
		return (
			<Placeholder>
				<Spinner />
			</Placeholder>
		);
	}

	const mayPreview = ! isEditing || isWide || isNavigationMode;

	return (
		<>
			{ idBase === 'text' && (
				<BlockControls group="other">
					<ConvertToBlocksButton
						clientId={ clientId }
						rawInstance={ instance.raw }
					/>
				</BlockControls>
			) }

			<InspectorControls>
				<InspectorCard
					name={ widgetType.name }
					description={ widgetType.description }
				/>
			</InspectorControls>

			<Form
				title={ widgetType.name }
				isVisible={ isEditing && ! isNavigationMode }
				id={ id }
				idBase={ idBase }
				instance={ instance }
				isWide={ isWide }
				onChangeInstance={ setInstance }
				onChangeHasPreview={ setHasPreview }
				onClose={ stopEditing }
			/>

			{ idBase && (
				<>
					{ hasPreview === null && (
						<Placeholder>
							<Spinner />
						</Placeholder>
					) }
					{ hasPreview === true && (
						<Preview
							idBase={ idBase }
							instance={ instance }
							isVisible={ mayPreview }
						/>
					) }
					{ hasPreview === false && mayPreview && (
						<NoPreview name={ widgetType.name } />
					) }
				</>
			) }
		</>
	);
}
