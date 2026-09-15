import UIKit
import ExpoModulesCore

public class UpiHandoffModule: Module {
  public func definition() -> ModuleDefinition {
    Name("UpiHandoff")

    AsyncFunction("listApps") { () -> [[String: String]] in
      let schemes: [(String, String)] = [
        ("phonepe", "PhonePe"),
        ("gpay", "Google Pay"),
        ("paytmmp", "Paytm"),
        ("bhim", "BHIM"),
        ("ppe", "PhonePe"),
      ]
      var apps: [[String: String]] = []
      for (scheme, name) in schemes {
        if let url = URL(string: "\(scheme)://"),
           UIApplication.shared.canOpenURL(url) {
          apps.append(["packageName": scheme, "name": name])
        }
      }
      return apps
    }

    AsyncFunction("pay") { (uri: String, packageName: String?) -> String in
      guard let url = URL(string: uri) else {
        throw NSError(domain: "UpiHandoff", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid UPI URI"])
      }
      DispatchQueue.main.async {
        UIApplication.shared.open(url)
      }
      // Returning from a UPI app is not SUCCESS.
      return "unknown"
    }
  }
}

