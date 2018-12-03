package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
# Use the same RN version that the JS tools use
react_native_version = package['dependencies']['react-native']

Pod::Spec.new do |s|
  s.name             = 'Gutenberg'
  s.version          = package['version']
  s.summary          = 'Printing since 1440'
  s.homepage     = 'https://github.com/wordpress-mobile/gutenberg-mobile'
  s.license      = package['license']
  s.authors          = 'Automattic'
  s.platform     = :ios, '10.0'
  s.source       = { :git => 'https://github.com/wordpress-mobile/gutenberg-mobile.git' }
  s.source_files = 'react-native-gutenberg-bridge/ios/*.{h,m,swift}'
  s.requires_arc = true
  s.preserve_paths = 'bundle/ios/*'

  s.dependency 'React/Core', react_native_version
  s.dependency 'React/CxxBridge', react_native_version
  s.dependency 'React/RCTAnimation', react_native_version
  s.dependency 'React/RCTImage', react_native_version
  s.dependency 'React/RCTLinkingIOS', react_native_version
  s.dependency 'React/RCTNetwork', react_native_version
  s.dependency 'React/RCTText', react_native_version
  s.dependency 'React/RCTActionSheet', react_native_version
  s.dependency 'React/DevSupport', react_native_version

  s.dependency 'WordPress-Aztec-iOS'
  s.dependency 'RNTAztecView'

  s.dependency 'yoga', "#{react_native_version}.React"
end
