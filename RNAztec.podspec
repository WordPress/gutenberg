require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'RNAztec'
  s.version          = package['version']
  s.summary          = package['description']
  s.license          = package['license']
  s.homepage         = 'https://github.com/wordpress-mobile/react-native-aztec'
  s.authors          = 'Horcrux Chen'
  s.source           = { :git => 'https://github.com/wordpress-mobile/react-native-aztec.git', :tag => s.version }
  s.source_files     = 'ios/**/*.{h,m,swift}'
  s.requires_arc     = true
  s.platforms        = { :ios => "8.0", :tvos => "9.2" }
  s.dependency         'React'  
end
