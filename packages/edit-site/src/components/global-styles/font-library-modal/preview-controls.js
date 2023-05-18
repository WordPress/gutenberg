/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import {
    RangeControl,
	__experimentalInputControl as InputControl,
    Button,
    __experimentalVStack as VStack,
} from '@wordpress/components';
import { update } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';

function PreviewControls () {

    const {
		demoConfig,
        updateDemoConfig,
        setDefaultDemoConfig        
    } = useContext( FontLibraryContext );

    const onDemoTextBlur = ( event ) => {
        if ( !event.target.value ) {
            setDefaultDemoConfig('text');
        }
    }

    return (
        <>
            <InputControl
                value={ demoConfig.text }
                placeholder={ __('Demo Text...') }
                label={ __( 'Demo Text' ) }
                onChange={ ( value ) => updateDemoConfig( 'text', value ) }
                onBlur={ onDemoTextBlur }
            />

            <div style={ { minWidth: "200px" } }>
                <RangeControl
                    label={ __( 'Font Size' ) }
                    value={ demoConfig.fontSize }
                    onChange={ ( value ) => updateDemoConfig( 'fontSize', value )  }
                    min={ 8 }
                    max={ 72 }
                />
            </div>

            <Button
                variant='secondary'
                onClick={ () => { setDefaultDemoConfig() } }
                icon={ update }
                style={ { marginTop: "20px" } }
            >
                { __( 'Reset' ) }
            </Button>

        </>
    )
}

export default PreviewControls;
