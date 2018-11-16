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
  s.source_files = 'react-native-gutenberg-bridge/ios/*.{h,m}'
  s.preserve_paths = 'src'
  s.requires_arc = true

  s.dependency 'React', react_native_version
  s.dependency 'Yoga'
  s.dependency 'RNSVG'
  s.dependency 'RNTAztecView'
end  
