package expo.modules.upihandoff

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class UpiHandoffModule : Module() {
  private var pending: Promise? = null
  private val requestCode = 9911

  override fun definition() = ModuleDefinition {
    Name("UpiHandoff")

    AsyncFunction("listApps") {
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, String>>()
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"))
      val pm = context.packageManager
      val resolved = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
      resolved.map { info ->
        mapOf(
          "packageName" to info.activityInfo.packageName,
          "name" to info.loadLabel(pm).toString(),
        )
      }
    }

    AsyncFunction("pay") { uri: String, packageName: String?, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "No current activity", null)
        return@AsyncFunction
      }
      pending = promise
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
      if (!packageName.isNullOrBlank()) {
        intent.setPackage(packageName)
      }
      try {
        activity.startActivityForResult(intent, requestCode)
      } catch (error: Exception) {
        pending = null
        promise.reject("LAUNCH_FAILED", error.message, error)
      }
    }

    OnActivityResult { payload ->
      if (payload.requestCode != requestCode) return@OnActivityResult
      val promise = pending ?: return@OnActivityResult
      pending = null
      val status = mapResult(payload.data)
      promise.resolve(status)
    }
  }

  // Returning from a UPI app is not SUCCESS unless extras say SUCCESS.
  private fun mapResult(data: Intent?): String {
    val raw = listOfNotNull(
      data?.getStringExtra("Status"),
      data?.getStringExtra("status"),
      data?.getStringExtra("STATUS"),
      data?.getStringExtra("response"),
      data?.getStringExtra("Response"),
    ).joinToString(" ")
    val normalized = raw.uppercase()
    return when {
      normalized.contains("SUCCESS") -> "success"
      normalized.contains("FAILURE") || normalized.contains("FAIL") -> "failed"
      else -> "unknown"
    }
  }
}
