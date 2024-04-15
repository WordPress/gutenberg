/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
    __experimentalSpacer as Spacer,
    __experimentalItemGroup as ItemGroup,
    __experimentalHeading as Heading,
    __experimentalInputControl as InputControl,
    Popover,
    RangeControl,
    Button,
    DropdownMenu,
    NavigableMenu,
    privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Icon, check, plus, moreVertical, shadow as shadowIcon, lineSolid } from '@wordpress/icons';
import { useState, useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

const shadowIndicatorStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '2px',
    boxSizing: 'border-box',
    color: '#2f2f2f',
    cursor: 'default',
    height: '26px',
    width: '26px',
    padding: 0,
}

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
            <ShadowsEditor label={ __( 'Custom' ) } shadows={ customShadows || [] } placeholder={ __('Custom shadows are empty!') } isCustom={true} onCreate={setCustomShadows}/>
        </VStack>;
}

function ShadowsEditor({label, placeholder, shadows: savedShadows, isCustom, onCreate}) {
    const [isEditing, setIsEditing] = useState(false);
    const [shadows, setShadows] = useState(savedShadows || []);

    // useEffect(() => {
    //     setShadows(savedShadows);
    // }, [savedShadows]);

    const handleAddShadow = () => {
        const newShadows = [
            ...shadows,
            {
                name: 'Custom shadow ' + (shadows.length + 1),
                slug: 'custom-shadow-' + (shadows.length + 1),
                shadow: '0 0 4px 4px rgba(0, 0, 0, 0.3)',
            }
        ]
        setShadows(newShadows);

        // onCreate();
    }

    const handleShadowChange = (index, shadow) => {
        const newShadows = [
            ...shadows.slice(0, index),
            shadow,
            ...shadows.slice(index + 1),
        ];
        setShadows(newShadows);
    }

    return <div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <Subtitle level={2}>
                { label }
            </Subtitle>
            <div style={{display: 'flex', alignItems: 'center'}}>
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
                {isCustom && <Button
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

        { isEditing ? <ShadowsEditorView label={label} shadows={shadows} isCustom={isCustom} onChange={handleShadowChange} /> : <ShadowsReadOnlyView label={label} shadows={shadows} placeholder={placeholder} /> }
        
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
        shadow={ shadow }
    />
) ) }
</Composite>
}

function ShadowIndicator( { label, isActive, onSelect, shadow } ) {
	return (
        <Button
            onClick={ onSelect }
            label={ label }
            style={ { ...shadowIndicatorStyle, boxShadow: shadow } }
            showTooltip
        >
            { isActive && <Icon icon={ check } /> }
        </Button>
    );
}

function ShadowsEditorView({label, shadows, isCustom, onChange}) {
    return <VStack spacing={ 3 }>
        <ItemGroup isRounded>
            {
                shadows.map( ( { name, slug, shadow }, index ) => (
                    <ShadowEditableItem key={ slug } label={ name } shadow={ shadow } isCustom={isCustom} onChange={(updated) => onChange(index, ({
                        name, slug,
                        shadow: updated,
                    }))} />
                ) )
            }
        </ItemGroup>
    </VStack>
}

function ShadowEditableItem({label, shadow, onChange, isCustom}) {
    const [isEditing, setIsEditing] = useState(false);
    const [ popoverAnchor, setPopoverAnchor ] = useState( null );
    const popoverProps = useMemo(
		() => ( {
            placement: 'left-start',
            offset: 36,
            shift: true,
			anchor: popoverAnchor,
		} ),
		[ popoverAnchor ]
	);

    return <div>
        <div ref={setPopoverAnchor} style={{display: 'flex', alignItems: 'center', padding: '6px', border: '1px solid rgba(0, 0, 0, 0.1)'}}>
            <div style={{marginBottom: '-4px'}}>
                <Icon icon={ shadowIcon } />
            </div>
            <div style={{flexGrow: 1, margin: '0 6px'}}>
                {
                    isCustom ? 
                    <InputControl
                        value={ label }
                        onChange={ () => {} }
                        onFocus={ () => {setIsEditing(true)} }
                    /> : <div style={{cursor: 'pointer'}} onClick={() => {setIsEditing(true)}}>{label}</div>
                }
            </div>
            <div style={{marginBottom: '-4px'}}>
                <Icon icon={ lineSolid } />
            </div>
        </div>
        {
            isEditing && <ShadowPopover shadow={shadow} popoverProps={popoverProps} onClose={ () => setIsEditing( false ) } onChange={onChange} />
        }
    </div>
}

function ShadowPopover({shadow: savedShadow, popoverProps, onClose, onChange}) {
    const shadowParts = shadowStringToObject(savedShadow || '');
    const [ shadow, setShadow ] = useState( {
        x: shadowParts.x, 
        y: shadowParts.y, 
        blur: shadowParts.blur, 
        spread: shadowParts.spread, 
        color: shadowParts.color,
    } );

    const shadowString = `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;

    const handleChange = ( key, value ) => {
        onChange(shadowString);
        setShadow( {
            ...shadow,
            [ key ]: value,
        } );
    };

    return <Popover {...popoverProps} onClose={onClose}>
        <div className="block-editor-global-styles__shadow-popover-container">
			<VStack spacing={ 4 }>
                <div style={{padding: '0.5rem'}}>
				    <Heading level={ 5 }>{ __( 'Drop shadow' ) }</Heading>
                </div>
                <div style={{padding: '0.5rem',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    <div style={ { ...shadowIndicatorStyle, boxShadow: shadowString } }
                    ></div>
                </div>
				<div style={{padding:'0 1rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div>
                        <RangeControl label="X position"
                            value={ shadow.x }
                            onChange={ ( value ) => handleChange( 'x', value ) }
                            withInputField={ false }
                            min={ 0 }
                            max={ 10 }
                        />
                    </div>
                    <div>
                        <RangeControl label="Y position"
                            value={ shadow.y }
                            onChange={ ( value ) => handleChange( 'y', value ) }
                            withInputField={ false }
                            min={ 0 }
                            max={ 10 }
                        />
                    </div>
                    <div>
                        <RangeControl label="Blur"
                            value={ shadow.blur }
                            onChange={ ( value ) => handleChange( 'blur', value ) }
                            withInputField={ false }
                            min={ 0 }
                            max={ 10 }
                        />
                    </div>
                    <div>
                        <RangeControl label="Spread"
                            value={ shadow.spread }
                            onChange={ ( value ) => handleChange( 'spread', value ) }
                            withInputField={ false }
                            min={ 0 }
                            max={ 10 }
                        />
                    </div>
                    {/* <div>Color</div> */}
                </div>
			</VStack>
		</div>
    </Popover>
}

function shadowStringToObject(shadow) {
    const colorStart = shadow.indexOf('rgb');
    let color = 'rgba(0, 0, 0, 0.5)';
    let shadows = [];
    if (colorStart !== -1) {
        color = shadow.substring(colorStart);
        shadows = shadow.substring(0, colorStart).trim().split(' ');
    } else {
        shadows = shadow.split(' ');
    }

    return shadows.length === 4 ? ({
        x: parseInt(shadows[0].replace('px', '')),
        y: parseInt(shadows[1].replace('px', '')),
        blur: parseInt(shadows[2].replace('px', '')),
        spread: parseInt(shadows[3].replace('px', '')),
        color: color,
    }) : shadows.length === 3 ? ({
        x: parseInt(shadows[0].replace('px', '')),
        y: parseInt(shadows[1].replace('px', '')),
        blur: parseInt(shadows[2].replace('px', '')),
        spread: 0,
        color: color,
    }) : shadows.length === 2 ? ({
        x: parseInt(shadows[0].replace('px', '')),
        y: parseInt(shadows[1].replace('px', '')),
        blur: 0,
        spread: 0,
        color: color,
    }) : ({
        x: 0, y: 0, blur: 0, spread: 0, color: color,
    });
}
