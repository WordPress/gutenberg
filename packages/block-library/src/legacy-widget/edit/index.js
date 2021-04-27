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
import { ToolbarButton, Spinner, Placeholder } from '@wordpress/components';
import { brush as brushIcon, update as updateIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import WidgetTypeSelector from './widget-type-selector';
import InspectorCard from './inspector-card';
import FormWrapper from './form-wrapper';
import Form from './form';
import Preview from './preview';
import NoPreview from './no-preview';
import useForm from './use-form';

export default function Edit( props ) {
	const { id, idBase } = props.attributes;
	return (
		<div { ...useBlockProps() }>
			{ ! id && ! idBase ? (
				<Empty { ...props } />
			) : (
				<NotEmpty { ...props } />
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
	isSelected,
} ) {
	const {
		widgetType,
		hasResolvedWidgetType,
		isWidgetTypeHidden,
		isNavigationMode,
	} = useSelect(
		( select ) => {
			const widgetTypeId = id ?? idBase;
			const hiddenIds =
				select( blockEditorStore ).getSettings()
					?.widgetTypesToHideFromLegacyWidgetBlock ?? [];
			return {
				widgetType: select( coreStore ).getWidgetType( widgetTypeId ),
				hasResolvedWidgetType: select(
					coreStore
				).hasFinishedResolution( 'getWidgetType', [ widgetTypeId ] ),
				isWidgetTypeHidden: hiddenIds.includes( widgetTypeId ),
				isNavigationMode: select( blockEditorStore ).isNavigationMode(),
			};
		},
		[ id, idBase ]
	);

	const setInstance = useCallback( ( nextInstance ) => {
		setAttributes( { instance: nextInstance } );
	}, [] );

	const { content, setFormData, hasPreview } = useForm( {
		id,
		idBase,
		instance,
		setInstance,
	} );

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

	if ( ! hasResolvedWidgetType || hasPreview === null ) {
		return (
			<Placeholder>
				<Spinner />
			</Placeholder>
		);
	}

	const mode = isNavigationMode || ! isSelected ? 'preview' : 'edit';

	return (
		<>
			{ ! isWidgetTypeHidden && (
				<BlockControls group="block">
					<ToolbarButton
						label={ __( 'Change widget' ) }
						icon={ updateIcon }
						onClick={ () =>
							setAttributes( {
								id: null,
								idBase: null,
								instance: null,
							} )
						}
					/>
				</BlockControls>
			) }

			<InspectorControls>
				<InspectorCard
					name={ widgetType.name }
					description={ widgetType.description }
				/>
			</InspectorControls>

			<FormWrapper
				title={ widgetType.name }
				isVisible={ mode === 'edit' }
			>
				<Form
					id={ id }
					idBase={ idBase }
					content={ content }
					setFormData={ setFormData }
				/>
			</FormWrapper>

			{ idBase &&
				( hasPreview ? (
					<Preview
						idBase={ idBase }
						instance={ instance }
						isVisible={ mode === 'preview' }
					/>
				) : (
					mode === 'preview' && <NoPreview name={ widgetType.name } />
				) ) }
		</>
	);
}
