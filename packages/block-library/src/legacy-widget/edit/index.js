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
import {
	ToolbarGroup,
	ToolbarButton,
	Spinner,
	Placeholder,
} from '@wordpress/components';
import { brush as brushIcon, update as updateIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import WidgetTypeSelector from './widget-type-selector';
import InspectorCard from './inspector-card';
import FormWrapper from './form-wrapper';
import Form from './form';
import Preview from './preview';

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
	const { widgetType, hasResolved, isWidgetTypeHidden } = useSelect(
		( select ) => {
			const widgetTypeId = id ?? idBase;
			const hiddenIds =
				select( blockEditorStore ).getSettings()
					?.widgetTypesToHideFromLegacyWidgetBlock ?? [];
			return {
				widgetType: select( coreStore ).getWidgetType( widgetTypeId ),
				hasResolved: select(
					coreStore
				).hasFinishedResolution( 'getWidgetType', [ widgetTypeId ] ),
				isWidgetTypeHidden: hiddenIds.includes( widgetTypeId ),
			};
		},
		[ id, idBase ]
	);

	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	const [ pendingInstance, setPendingInstance ] = useState( instance );

	const applyChanges = () => {
		setAttributes( { instance: pendingInstance } );
		clearSelectedBlock();
	};

	useEffect( () => {
		if ( ! isSelected ) {
			setPendingInstance( instance );
		}
	}, [ isSelected ] );

	if ( ! widgetType && ! hasResolved ) {
		return <Spinner />;
	}

	if ( ! widgetType && hasResolved ) {
		return <Placeholder>{ __( 'Widget is missing.' ) }</Placeholder>;
	}

	return (
		<>
			<BlockControls>
				{ ! isWidgetTypeHidden && (
					<ToolbarGroup>
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
					</ToolbarGroup>
				) }
				{ idBase && (
					<ToolbarGroup>
						<ToolbarButton onClick={ applyChanges }>
							{ __( 'Apply' ) }
						</ToolbarButton>
						<ToolbarButton onClick={ clearSelectedBlock }>
							{ __( 'Cancel' ) }
						</ToolbarButton>
					</ToolbarGroup>
				) }
			</BlockControls>

			<InspectorControls>
				<InspectorCard
					name={ widgetType.name }
					description={ widgetType.description }
				/>
			</InspectorControls>

			<FormWrapper title={ widgetType.name } isVisible={ isSelected }>
				<Form
					id={ id }
					idBase={ idBase }
					instance={ pendingInstance }
					setInstance={ setPendingInstance }
				/>
			</FormWrapper>

			{ idBase && (
				<Preview
					idBase={ idBase }
					instance={ instance }
					isVisible={ ! isSelected }
				/>
			) }
		</>
	);
}
