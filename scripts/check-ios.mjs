import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const read = (p) => fs.readFileSync(p, "utf8");
const config = JSON.parse(read("capacitor.config.json"));
assert.equal(config.appId, "com.walthemort.lifesim");
assert.equal(config.webDir, "dist");
assert.ok(
  !config.server?.url,
  "Release must bundle assets, not load a dev server",
);
const project = read("ios/App/App.xcodeproj/project.pbxproj"),
  info = read("ios/App/App/Info.plist"),
  privacy = read("ios/App/App/PrivacyInfo.xcprivacy");
assert.ok(project.includes("TARGETED_DEVICE_FAMILY = 1;"));
assert.ok(project.includes("MARKETING_VERSION = 0.17.0;"));
assert.ok(
  /Begin PBXResourcesBuildPhase section[\s\S]*?PrivacyInfo\.xcprivacy in Resources[\s\S]*?End PBXResourcesBuildPhase section/.test(
    project,
  ),
);
assert.ok(project.includes("SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = NO;"));
assert.ok(project.includes("SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD = NO;"));
assert.ok(info.includes("UIInterfaceOrientationPortrait"));
assert.ok(!info.includes("UIInterfaceOrientationLandscape"));
assert.ok(info.includes("ITSAppUsesNonExemptEncryption"));
for (const value of [
  "NSPrivacyTracking",
  "NSPrivacyCollectedDataTypes",
  "CA92.1",
  "C617.1",
])
  assert.ok(privacy.includes(value));
const icon = fs.readFileSync(
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
);
assert.equal(icon.readUInt32BE(16), 1024);
assert.equal(icon.readUInt32BE(20), 1024);
assert.equal(icon[25], 2, "App icon must be RGB without alpha");
assert.equal(
  read("dist/index.html"),
  read("ios/App/App/public/index.html"),
  "Native copy must match the current production build",
);
function compareBundle(relative = "") {
  for (const entry of fs.readdirSync(path.join("dist", relative), {
    withFileTypes: true,
  })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) compareBundle(child);
    else
      assert.deepEqual(
        fs.readFileSync(path.join("dist", child)),
        fs.readFileSync(path.join("ios/App/App/public", child)),
        `Native asset differs: ${child}`,
      );
  }
}
compareBundle();
for (const name of ["countries-license.txt", "cities-CC-BY-4.0.txt"])
  assert.ok(read(`ios/App/App/public/licenses/${name}`).length > 1000);
const native = JSON.parse(read("ios/App/App/capacitor.config.json"));
assert.equal(native.appId, config.appId);
assert.ok(!native.server?.url);
console.log(
  "iOS packaging checks passed: iPhone portrait target, bundled production assets, 1024px opaque icon, privacy manifest and export metadata. Native compilation/signing requires macOS and Xcode.",
);
