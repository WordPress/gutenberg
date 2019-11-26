package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
# Use the same RN version that the JS tools use
react_native_version = package['dependencies']['react-native']
# Extract the tagged version if package.json points to a tag
react_native_version = react_native_version.split("#v").last if react_native_version.include? "#v"

Pod::Spec.new do |s|
  s.name             = 'Gutenberg'
  s.version          = package['version']
  s.summary          = 'Printing since 1440'
  s.homepage     = 'https://github.com/wordpress-mobile/gutenberg-mobile'
  s.license      = package['license']
  s.authors          = 'Automattic'
  s.platform     = :ios, '11.0'
  s.source       = { :git => 'https://github.com/wordpress-mobile/gutenberg-mobile.git' }
  s.source_files = 'react-native-gutenberg-bridge/ios/*.{h,m,swift}'
  s.requires_arc = true
  s.preserve_paths = 'bundle/ios/*'
  s.swift_version = '5.0'

  s.dependency 'React', react_native_version
  s.dependency 'React-CoreModules', react_native_version
  s.dependency 'React-RCTImage', react_native_version

  s.dependency 'RNTAztecView'
end
