/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalVStack as VStack,
    __experimentalSpacer as Spacer,
    Button,
    privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Icon, check, plus, moreVertical } from '@wordpress/icons';
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
            <ShadowsEditor label={ __( 'Custom' ) } shadows={ customShadows || [] } placeholder={ __('Custom shadows are empty!') } canCreate={true}/>
        </VStack>;
}

function ShadowsEditor({label, placeholder, shadows, canCreate}) {
    const { CompositeV2: Composite, useCompositeStoreV2: useCompositeStore } =
		unlock( componentsPrivateApis );
	const compositeStore = useCompositeStore();

    const [isEditing, setIsEditing] = useState(false);

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
                    onClick={ () => {} }
                />
                }

                {
                    !shadows.length ? null : <Button
                        size="small"
                        icon={ moreVertical }
                        label={ __( 'Add shadow' ) }
                        onClick={ () => { setIsEditing(true) } }
                    />
                }
            </div>
        </div>
        <Spacer height={ 4 } />

        <Composite
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
    </div>
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