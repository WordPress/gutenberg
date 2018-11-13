# Use the same RN version that the JS tools use
react_native_version = '0.57.1'

Pod::Spec.new do |s|
  s.name         = 'RNReactNativeGutenbergBridge'
  s.version      = '0.1.0'
  s.summary      = 'RNReactNativeGutenbergBridge'
  s.description  = <<-DESC
                  The RNReactNativeGutenbergBridge
                   DESC
  s.homepage     = 'https://github.com/wordpress-mobile/gutenberg-mobile'
  s.license      = 'MIT'
  s.author       = { 'author' => 'author@domain.cn' }
  s.platform     = :ios, '10.0'
  s.source       = { :git => 'https://github.com/author/RNReactNativeGutenbergBridge.git', :tag => 'master' }
  s.source_files = 'ios/*.{h,m}'
  s.requires_arc = true

  s.dependency 'React/Core', react_native_version
  s.dependency 'React/CxxBridge', react_native_version
  s.dependency 'React/RCTAnimation', react_native_version
  s.dependency 'React/RCTImage', react_native_version
  s.dependency 'React/RCTLinkingIOS', react_native_version
  s.dependency 'React/RCTNetwork', react_native_version
  s.dependency 'React/RCTText', react_native_version
  s.dependency 'React/RCTActionSheet', react_native_version
  s.dependency 'React/DevSupport', react_native_version

  s.dependency 'yoga', "#{react_native_version}.React"
end

  
