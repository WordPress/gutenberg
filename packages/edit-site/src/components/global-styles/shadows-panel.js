/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
    __experimentalSpacer as Spacer,
    __experimentalItemGroup as ItemGroup,
    Button,
    DropdownMenu,
    NavigableMenu,
    privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Icon, check, plus, moreVertical, shadow as shadowIcon, lineSolid } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

export default function ShadowsPanel() {
    const [ defaultShadows, setDefaultShadows ] = useGlobalSetting(
		'shadow.presets.default',
	);
    const [ themeShadows, setThemeShadows ] = useGlobalSetting(
		'shadow.presets.theme'
	);
    const [ customShadows, setCustomShadows ] = useGlobalSetting(
		'shadow.presets.custom'
	);

    return <VStack
			className="edit-site-global-styles-shadows-panel"
			spacing={ 7 }
		>
            <ShadowsEditor label={ __( 'Default' ) } shadows={ defaultShadows || [] } />
            <ShadowsEditor label={ __( 'Theme' ) } shadows={ themeShadows || [] } placeholder={ __('Theme shadows are empty!') } />
            <ShadowsEditor label={ __( 'Custom' ) } shadows={ customShadows || [] } placeholder={ __('Custom shadows are empty!') } canCreate={true} onCreate={setCustomShadows}/>
        </VStack>;
}

function ShadowsEditor({label, placeholder, shadows, canCreate, onCreate}) {
    const [isEditing, setIsEditing] = useState(false);

    const handleAddShadow = () => {
        onCreate([
            ...shadows,
            {
                name: 'Custom shadow ' + (shadows.length + 1),
                slug: 'custom-shadow-' + (shadows.length + 1),
                shadow: '0 0 0 0 rgba(0, 0, 0, 0)',
            }
        ]);
    }

    return <div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <Subtitle level={2}>
                { label }
            </Subtitle>
            <div>
                { isEditing && (
                    <Button
                        size="small"
                        style={ { color: 'blue' } }
                        onClick={ () => {
                            setIsEditing( false );
                        } }
                    >
                        { __( 'Done' ) }
                    </Button>
                ) }
                {canCreate && <Button
                    size="small"
                    icon={ plus }
                    label={ __( 'Add shadow' ) }
                    onClick={ () => {
                        handleAddShadow();
                        setIsEditing( true );
                    } }
                />
                }

                {
                    !shadows.length ? null : <DropdownMenu
                    icon={ moreVertical }
                    label={ __( 'Shadow options' ) }
                    toggleProps={ {
                        size: 'small',
                    } }
                >
                    { ( { onClose } ) => (
                    <NavigableMenu role="menu">
                        <Button
                            variant="tertiary"
                            onClick={ () => {
                                setIsEditing( true );
                                onClose();
                            } }
                            className="components-palette-edit__menu-button"
                        >
                            { __( 'Show details' ) }
                        </Button>
                    </NavigableMenu>
                    ) }
                    </DropdownMenu>
                }
            </div>
        </div>
        <Spacer height={ 4 } />

        { isEditing ? <ShadowsEditorView label={label} shadows={shadows} /> : <ShadowsReadOnlyView label={label} shadows={shadows} placeholder={placeholder} /> }
        
    </div>
}

function ShadowsReadOnlyView({label, shadows, placeholder}) {

    const { CompositeV2: Composite, useCompositeStoreV2: useCompositeStore } =
		unlock( componentsPrivateApis );
	const compositeStore = useCompositeStore();

    return <Composite
    store={ compositeStore }
    role="listbox"
    className="block-editor-global-styles__shadow__list"
    aria-label={ label }
>
{ !shadows.length ? <span>{placeholder}</span> : shadows.map( ( { name, slug, shadow } ) => (
    <ShadowIndicator
        key={ slug }
        label={ name }
        // isActive={ shadow === activeShadow }
        // onSelect={ () =>
        //     onSelect( shadow === activeShadow ? undefined : shadow )
        // }
        shadow={ shadow }
    />
) ) }
</Composite>
}

function ShadowIndicator( { label, isActive, onSelect, shadow } ) {
	return (
        <Button
            className={ 'block-editor-global-styles__shadow-indicator' }
            onClick={ onSelect }
            label={ label }
            style={ { boxShadow: shadow } }
            showTooltip
        >
            { isActive && <Icon icon={ check } /> }
        </Button>
    );
}

function ShadowsEditorView({label, shadows}) {
    return <VStack spacing={ 3 }>
        <ItemGroup isRounded>
            {
                shadows.map( ( { name, slug, shadow } ) => (
                    <ShadowEditableItem key={ slug } label={ name } shadow={ shadow } />
                ) )
            }
        </ItemGroup>
    </VStack>
}

function ShadowEditableItem({label, shadow}) {
    return <HStack justify="flex-start">
        <div>
            <Icon icon={ shadowIcon } />
        </div>
        <div style={{flexGrow: 1}}>{label}</div>
        <div>
            <Icon icon={ lineSolid } />
        </div>
    </HStack>
}
