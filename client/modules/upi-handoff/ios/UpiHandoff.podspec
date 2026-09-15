require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))

Pod::Spec.new do |s|
  s.name           = "UpiHandoff"
  s.version        = package["version"]
  s.summary        = "UPI handoff"
  s.description    = "UPI handoff"
  s.license        = "MIT"
  s.author         = "Pending"
  s.homepage       = "https://github.com/pending"
  s.platforms      = { :ios => "15.1" }
  s.source         = { :git => "https://github.com/pending.git" }
  s.static_framework = true
  s.dependency "ExpoModulesCore"
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
